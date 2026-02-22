import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { Library } from '../../core/library/library';
import { LibraryId } from '../../core/library/libraryId';
import { LibraryItem } from '../../core/library/libraryItem';
import { Macro } from '../../core/macro';
import { MacroId, getMacroId } from '../../core/macroId';
import { ExtensionContext } from '../../extensionContext';
import { NaturalComparer } from '../../utils/ui';
import { TreeDataProvider } from '../treeDataProvider';
import { createExecutionItem } from './executionItem';
import { createLibraryItem } from './libraryItem';
import { createMacroItem } from './macroItem';

export type TreeElement = Library | Macro | SandboxExecutionDescriptor;

interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files: Set<MacroId>;
}

export class ExplorerTreeDataProvider extends TreeDataProvider<TreeElement> {
  private readonly monitoredLibraries: Map<LibraryId, MonitoredLibraryData>;

  constructor(context: ExtensionContext) {
    super(context);
    this.monitoredLibraries = new Map();

    this.context.libraryManager.libraries.forEach((library) =>
      this.ensureLibraryIsMonitored(library),
    );

    this.disposables.push(
      this.context.libraryManager.onDidChangeLibraries(() => {
        this.disposeMonitoredLibraries();
        this.onDidChangeTreeDataEmitter.fire(undefined);
      }),
      this.context.sandboxManager.onExecutionStart(({ macro }) =>
        this.fireOnDidChangeTreeData(macro),
      ),
      this.context.sandboxManager.onExecutionEnd(({ macro }) =>
        this.fireOnDidChangeTreeData(macro),
      ),
      {
        dispose: () => this.disposeMonitoredLibraries(),
      },
    );
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
          if (files?.has(getMacroId(uri))) {
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

  private fireOnDidChangeTreeData(element: TreeElement, library?: Library): void {
    let data: TreeElement[] | TreeElement = element;
    if (element instanceof Macro) {
      // Refresh parent as Macro changes collapsible state, and
      // that won't be refreshed unless parent changes.
      const parent = library ?? this.getParent(element);
      if (parent) {
        data = [parent, element];
      }
    }
    this.onDidChangeTreeDataEmitter.fire(data);
  }

  public override async getChildren(element?: TreeElement): Promise<TreeElement[] | undefined> {
    let children: TreeElement[] | undefined;

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
      const executor = this.context.sandboxManager.getExecutor(element);
      if (executor) {
        children = executor.executions.sort((a, b) => NaturalComparer.compare(a.id, b.id));
      }
    }

    return children;
  }

  public override getParent(element: TreeElement): TreeElement | undefined {
    let parent: TreeElement | undefined;
    if (element instanceof Macro) {
      parent = this.context.libraryManager.libraryFor(element.uri);
    } else if (element instanceof SandboxExecutionDescriptor) {
      parent = element.macro;
    }
    return parent;
  }

  public override async getTreeItem(element: TreeElement): Promise<vscode.TreeItem> {
    let treeItem: vscode.TreeItem;

    if (element instanceof Library) {
      treeItem = createLibraryItem(element);
    } else if (element instanceof Macro) {
      treeItem = await createMacroItem(element, this.context);
    } else {
      treeItem = createExecutionItem(element);
    }

    return treeItem;
  }
}
