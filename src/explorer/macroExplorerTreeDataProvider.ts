import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibrary, MacroLibraryId } from '../core/library/macroLibrary';
import { getMacroId, Macro, MacroId } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { NaturalComparer } from '../utils/ui';
import { getLibraryItem, getMacroItem, getRunItem } from './macroExplorerTreeItems';
import { UntitledMacroLibrary } from './untitledMacroLibrary';

export type TreeElement = MacroLibrary | Macro | MacroRunInfo;
export type TreeEvent = TreeElement | TreeElement[] | undefined;

interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files: Set<MacroId>;
}

export class MacroExplorerTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<MacroLibraryId, MonitoredLibraryData>;
  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<TreeEvent>;
  private readonly untitledLibrary: UntitledMacroLibrary;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.monitoredLibraries = new Map();
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    this.untitledLibrary = new UntitledMacroLibrary(this.context);

    [...this.context.libraryManager.libraries.get(), this.untitledLibrary].forEach((library) =>
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
      this.untitledLibrary,
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
  }

  private ensureLibraryIsMonitored(library: MacroLibrary): MonitoredLibraryData {
    let entry = this.monitoredLibraries.get(library.id);
    if (!entry) {
      const createHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files) {
          const macroId = getMacroId(uri);
          if (!files.has(macroId)) {
            files.add(macroId);
            this.fireOnDidChangeTreeData(new Macro(uri), library);
          }
        }
      };

      const deleteHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && files.has(getMacroId(uri))) {
          this.fireOnDidChangeTreeData(library);
        }
      };

      entry = {
        files: new Set(),
        disposable: vscode.Disposable.from(
          // VS Code does not report first-time saved files as
          // created but rather as changed, for reasons.
          library.onDidCreateMacro(createHandler),
          library.onDidChangeMacro(createHandler),
          library.onDidDeleteMacro(deleteHandler),
        ),
      };
      this.monitoredLibraries.set(library.id, entry);
    }
    return entry;
  }

  private fireOnDidChangeTreeData(
    macroOrLibrary: Macro | MacroLibrary,
    library?: MacroLibrary,
  ): void {
    if (macroOrLibrary instanceof MacroLibrary) {
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
      children = [...this.context.libraryManager.libraries.get()].sort((a, b) =>
        NaturalComparer.compare(a.name, b.name),
      );
      children.push(this.untitledLibrary);
    } else if (element instanceof MacroLibrary) {
      const uris = await element.getFiles();
      children = uris
        .map((uri) => new Macro(uri))
        .sort((a, b) => NaturalComparer.compare(a.name, b.name));
      const entry = this.ensureLibraryIsMonitored(element);
      entry.files = new Set(children.map((macro) => macro.id));
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      children = [...runner.runInstances].sort((a, b) => NaturalComparer.compare(a.id, b.id));
    } else {
      children = [];
    }

    return children;
  }

  getParent(element: TreeElement): TreeElement | undefined {
    let parent: TreeElement | undefined;
    if (element instanceof Macro) {
      parent = this.untitledLibrary.owns(element)
        ? this.untitledLibrary
        : this.context.libraryManager.getLibrary(element);
    } else if (element instanceof MacroRunner) {
      parent = element.macro;
    }
    return parent;
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    let treeItem: vscode.TreeItem;

    if (element instanceof MacroLibrary) {
      treeItem = getLibraryItem(element);
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      treeItem = getMacroItem(element, runner);
    } else {
      treeItem = getRunItem(element);
    }

    return treeItem;
  }

  get onDidChangeTreeData(): vscode.Event<TreeEvent> {
    return this.onDidChangeTreeDataEmitter.event;
  }
}
