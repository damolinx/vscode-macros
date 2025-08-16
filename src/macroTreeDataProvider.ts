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

export class MacroTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<MacroLibraryId, vscode.Disposable>;
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
        if (this.monitoredLibraries.size > 0) {
          vscode.Disposable.from(...this.monitoredLibraries.values()).dispose();
        }
        this.onDidChangeTreeDataEmitter.fire(undefined);
      }),
      {
        dispose: () => {
          if (this.monitoredLibraries.size > 0) {
            vscode.Disposable.from(...this.monitoredLibraries.values()).dispose();
          }
        },
      },
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
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
      this.monitorLibrary(element);
      const macros = await element.getFiles();
      result = macros.map((uri) => new Macro(uri));
    } else {
      result = [];
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  private monitorLibrary(element: MacroLibrary) {
    if (!this.monitoredLibraries.has(element.id)) {
      const handler = (_uri: vscode.Uri) => this.onDidChangeTreeDataEmitter.fire(element);
      this.monitoredLibraries.set(
        element.id,
        vscode.Disposable.from(
          element.onDidCreateMacros(handler),
          element.onDidDeleteMacros(handler),
        ),
      );
    }
  }

  get onDidChangeTreeData(): vscode.Event<TreeElement | TreeElement[] | undefined> {
    return this.onDidChangeTreeDataEmitter.event;
  }
}
