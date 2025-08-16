import * as vscode from 'vscode';
import { MacroLibrary, MacroLibraryId } from './core/library/macroLibrary';
import { Macro } from './core/macro';
import { ExtensionContext } from './extensionContext';
import { uriBasename } from './utils/uri';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';

export function registerMacroTreeProvider(context: ExtensionContext): vscode.Disposable {
  return vscode.window.registerTreeDataProvider(
    MACRO_EXPLORER_VIEW_ID,
    new MacroTreeDataProvider(context),
  );
}

type TreeElement = Macro | MacroLibrary;
interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files?: Set<string>;
}

export class MacroTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<MacroLibraryId, MonitoredLibraryData>;
  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<
    TreeElement | TreeElement[] | undefined
  >;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.monitoredLibraries = new Map();
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();

    this.disposables = [
      this.onDidChangeTreeDataEmitter,
      this.context.libraryManager.onDidChangeLibraries(() => {
        this.disposeMonitoredLibraries();
        this.onDidChangeTreeDataEmitter.fire(undefined);
      }),
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

  getTreeItem(element: TreeElement): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(uriBasename(element.uri));
    treeItem.resourceUri = element.uri;

    if (element instanceof MacroLibrary) {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      treeItem.contextValue = 'macroLibrary';
    } else {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
      treeItem.command = {
        arguments: [element.uri],
        command: 'vscode.open',
        title: 'Open Macro',
      };
      treeItem.contextValue = 'macroFile';
    }
    return treeItem;
  }

  async getChildren(element?: TreeElement): Promise<TreeElement[]> {
    let result: TreeElement[];
    if (!element) {
      result = [...this.context.libraryManager.libraries.get()];
    } else if (element instanceof MacroLibrary) {
      const macroFiles = await element.getFiles();
      result = macroFiles.map((uri) => new Macro(uri));
      const entry = this.monitorLibrary(element);
      if (entry) {
        entry.files = new Set(macroFiles.map((f) => f.toString(true)));
      }
    } else {
      result = [];
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  private monitorLibrary(library: MacroLibrary): MonitoredLibraryData | undefined {
    let entry: MonitoredLibraryData | undefined;
    if (!this.monitoredLibraries.has(library.id)) {
      const createHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && !files.has(uri.toString())) {
          files.add(uri.toString());
          this.onDidChangeTreeDataEmitter.fire(library);
        }
      };

      const deleteHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && files.has(uri.toString())) {
          this.onDidChangeTreeDataEmitter.fire(library);
        }
      };

      entry = {
        files: undefined,
        disposable: vscode.Disposable.from(
          // VS Code does not report first-time saved files as
          // created but rather as changed,, for reasons.
          library.onDidCreateMacro(createHandler),
          library.onDidChangeMacro(createHandler),
          library.onDidDeleteMacro(deleteHandler),
        ),
      };
      this.monitoredLibraries.set(library.id, entry);
    }
    return entry;
  }

  get onDidChangeTreeData(): vscode.Event<TreeElement | TreeElement[] | undefined> {
    return this.onDidChangeTreeDataEmitter.event;
  }
}
