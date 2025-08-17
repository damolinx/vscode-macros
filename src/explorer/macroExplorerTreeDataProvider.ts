import * as vscode from 'vscode';
import { MacroLibrary, MacroLibraryId } from '../core/library/macroLibrary';
import { getMacroId, Macro, MacroId } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { uriBasename } from '../utils/uri';

export type MacroExplorerTreeElement = Macro | MacroLibrary;

interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files?: Set<MacroId>;
}

export class MacroExplorerTreeDataProvider
  implements vscode.TreeDataProvider<MacroExplorerTreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<MacroLibraryId, MonitoredLibraryData>;
  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<
    MacroExplorerTreeElement | MacroExplorerTreeElement[] | undefined
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

  getTreeItem(element: MacroExplorerTreeElement): vscode.TreeItem {
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

  async getChildren(element?: MacroExplorerTreeElement): Promise<MacroExplorerTreeElement[]> {
    let result: MacroExplorerTreeElement[];
    if (!element) {
      result = [...this.context.libraryManager.libraries.get()];
    } else if (element instanceof MacroLibrary) {
      const macroFiles = await element.getFiles();
      result = macroFiles.map((uri) => new Macro(uri));
      const entry = this.ensureLibraryIsMonitored(element);
      if (entry) {
        entry.files = new Set(macroFiles.map((f) => f.toString(true)));
      }
    } else {
      result = [];
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  private ensureLibraryIsMonitored(library: MacroLibrary): MonitoredLibraryData {
    let entry = this.monitoredLibraries.get(library.id);
    if (!entry) {
      const createHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && !files.has(getMacroId(uri))) {
          files.add(uri.toString());
          this.onDidChangeTreeDataEmitter.fire(library);
        }
      };

      const deleteHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && files.has(getMacroId(uri))) {
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

  get onDidChangeTreeData(): vscode.Event<
    MacroExplorerTreeElement | MacroExplorerTreeElement[] | undefined
  > {
    return this.onDidChangeTreeDataEmitter.event;
  }
}
