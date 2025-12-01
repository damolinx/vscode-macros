import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroRunner } from '../core/execution/macroRunner';
import { Library } from '../core/library/library';
import { LibraryId } from '../core/library/libraryId';
import { LibraryItem } from '../core/library/libraryItem';
import { Macro } from '../core/macro';
import { MacroId, getMacroId } from '../core/macroId';
import { ExtensionContext } from '../extensionContext';
import { NaturalComparer } from '../utils/ui';
import { createLibraryItem } from './items/libraryItem';
import { createMacroItem } from './items/macroItem';
import { createRunInfoItem } from './items/runInfoItem';

export type TreeElement = Library | Macro | MacroRunInfo;
export type TreeEvent = TreeElement | TreeElement[] | undefined;

interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files: Set<MacroId>;
}

export class ExplorerTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<LibraryId, MonitoredLibraryData>;
  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<TreeEvent>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.monitoredLibraries = new Map();
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();

    this.context.libraryManager.libraries.forEach((library) =>
      this.ensureLibraryIsMonitored(library),
    );

    this.disposables = [
      this.onDidChangeTreeDataEmitter,
      this.context.libraryManager.onDidChangeLibraries(() => {
        this.disposeMonitoredLibraries();
        this.onDidChangeTreeDataEmitter.fire(undefined);
      }),
      this.context.runnerManager.onRun(({ macro }) => this.fireOnDidChangeTreeData(macro)),
      this.context.runnerManager.onStop(({ runInfo }) =>
        this.fireOnDidChangeTreeData(runInfo.macro),
      ),
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
    this.disposeMonitoredLibraries();
  }

  private disposeMonitoredLibraries() {
    for (const { disposable } of this.monitoredLibraries.values()) {
      try {
        disposable.dispose();
      } catch (e: any) {
        this.context.log.error(e.message ?? e);
      }
    }
    this.monitoredLibraries.clear();
  }

  private ensureLibraryIsMonitored(library: Library): MonitoredLibraryData {
    let entry = this.monitoredLibraries.get(library.id);
    if (!entry) {
      const createHandler = (items: LibraryItem[]) => {
        items.forEach(({ uri }) => {
          const files = this.monitoredLibraries.get(library.id)?.files;
          if (files) {
            const macroId = getMacroId(uri);
            if (!files.has(macroId)) {
              files.add(macroId);
              this.fireOnDidChangeTreeData(new Macro(uri, macroId), library);
            }
          }
        });
      };

      const deleteHandler = (items: LibraryItem[]) => {
        items.forEach(({ uri }) => {
          const files = this.monitoredLibraries.get(library.id)?.files;
          if (files && files.has(getMacroId(uri))) {
            this.fireOnDidChangeTreeData(library);
          }
        });
      };

      entry = {
        files: new Set(),
        disposable: vscode.Disposable.from(
          // VS Code does not report first-time saved files as
          // created but rather as changed, for reasons.
          library.onDidAddFiles(createHandler),
          library.onDidChangeFiles(createHandler),
          library.onDidRemoveFiles(deleteHandler),
        ),
      };
      this.monitoredLibraries.set(library.id, entry);
    }
    return entry;
  }

  private fireOnDidChangeTreeData(macroOrLibrary: Macro | Library, library?: Library): void {
    if (macroOrLibrary instanceof Library) {
      this.onDidChangeTreeDataEmitter.fire(macroOrLibrary);
    } else {
      // Refresh parent as Macro changes collapsible state, and
      // that won't be refreshed unless parent changes.
      const parent = library ?? this.getParent(macroOrLibrary);
      this.onDidChangeTreeDataEmitter.fire(parent ? [parent, macroOrLibrary] : macroOrLibrary);
    }
  }

  async getChildren(element?: TreeElement): Promise<TreeElement[]> {
    let children: TreeElement[];

    if (!element) {
      children = [...this.context.libraryManager.libraries].sort((a, b) =>
        a.sorting === b.sorting ? NaturalComparer.compare(a.name, b.name) : a.sorting - b.sorting,
      );
    } else if (element instanceof Library) {
      const uris = await element.getFiles();
      children = uris
        .map(({ uri }) => new Macro(uri))
        .sort((a, b) => NaturalComparer.compare(a.name, b.name));
      const entry = this.ensureLibraryIsMonitored(element);
      entry.files = new Set((children as Macro[]).map((macro) => macro.id));
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      children = [...runner.runInstances].sort((a, b) =>
        NaturalComparer.compare(a.runId.index, b.runId.index),
      );
    } else {
      children = [];
    }

    return children;
  }

  getParent(element: TreeElement): TreeElement | undefined {
    let parent: TreeElement | undefined;
    if (element instanceof Macro) {
      parent = this.context.libraryManager.libraryFor(element.uri);
    } else if (element instanceof MacroRunner) {
      parent = element.macro;
    }
    return parent;
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    let treeItem: vscode.TreeItem;

    if (element instanceof Library) {
      treeItem = createLibraryItem(element);
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      treeItem = createMacroItem(element, runner);
    } else {
      treeItem = createRunInfoItem(element);
    }

    return treeItem;
  }

  get onDidChangeTreeData(): vscode.Event<TreeEvent> {
    return this.onDidChangeTreeDataEmitter.event;
  }

  refresh(): void {
    return this.onDidChangeTreeDataEmitter.fire(undefined);
  }
}
