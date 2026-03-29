import * as vscode from 'vscode';
import { Library } from '../core/library/library';
import { LibraryItemId } from '../core/library/libraryItem';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { ExplorerTreeDataProvider, TreeElement } from './explorer/explorerTreeDataProvider';
import { ExplorerTreeDragAndDropController } from './explorer/explorerTreeDragAndDropController';
import { StartupTreeDataProvider } from './startup/startupTreeDataProvider';
import { StartupTreeDragAndDropController } from './startup/startupTreeDragAndDropController';
import { TreeViewState } from './treeViewState';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';
export const STARTUP_MACROS_VIEW_ID = 'macros.startupMacros';

export let explorerTreeView: vscode.TreeView<TreeElement> | undefined;
export let explorerTreeViewExpansionState: TreeViewState<LibraryItemId> | undefined;

let explorerTreeDataProvider: ExplorerTreeDataProvider | undefined;
let startupTreeDataProvider: StartupTreeDataProvider | undefined;

export function refreshTreeView(tree: 'all' | 'explorer' | 'startup'): void {
  switch (tree) {
    case 'all':
      explorerTreeDataProvider?.refresh();
      startupTreeDataProvider?.refresh();
      break;
    case 'explorer':
      explorerTreeDataProvider?.refresh();
      break;
    case 'startup':
      startupTreeDataProvider?.refresh();
      break;
  }
}

export function registerTreeViews(context: ExtensionContext): void {
  registerExplorerTreeview(context);
  registerStartupTreeview(context);

  function registerExplorerTreeview(context: ExtensionContext): void {
    explorerTreeDataProvider = new ExplorerTreeDataProvider(context);
    explorerTreeViewExpansionState = new TreeViewState(context, 'macros.explorer.expanded');
    explorerTreeView = vscode.window.createTreeView(MACRO_EXPLORER_VIEW_ID, {
      dragAndDropController: new ExplorerTreeDragAndDropController(context),
      showCollapseAll: true,
      treeDataProvider: explorerTreeDataProvider,
    });

    context.disposables.push(
      explorerTreeDataProvider,
      explorerTreeView,
      explorerTreeDataProvider.onDidChangeTreeData(async (elementOrElements) => {
        const element =
          elementOrElements instanceof Array
            ? elementOrElements.findLast((elem) => elem instanceof Macro)
            : elementOrElements instanceof Macro
              ? elementOrElements
              : undefined;
        if (element) {
          await explorerTreeView?.reveal(element);
        }
        explorerTreeViewExpansionState?.prune(context.libraryManager.libraries.map(({ id }) => id));
      }),
      explorerTreeView.onDidCollapseElement(({ element }) => {
        if (element instanceof Library) {
          explorerTreeViewExpansionState?.onCollapse(element.id);
        }
      }),
      explorerTreeView.onDidExpandElement(({ element }) => {
        if (element instanceof Library) {
          explorerTreeViewExpansionState?.onExpand(element.id);
        }
      }),
    );
  }

  function registerStartupTreeview(context: ExtensionContext): void {
    startupTreeDataProvider = new StartupTreeDataProvider(context);
    const treeView = vscode.window.createTreeView(STARTUP_MACROS_VIEW_ID, {
      dragAndDropController: new StartupTreeDragAndDropController(context),
      treeDataProvider: startupTreeDataProvider,
    });

    context.disposables.push(startupTreeDataProvider, treeView);
  }
}

export async function revealTreeView(tree: 'explorer' | 'startup'): Promise<void> {
  switch (tree) {
    case 'explorer':
      return vscode.commands.executeCommand(`${MACRO_EXPLORER_VIEW_ID}.focus`);
    case 'startup':
      startupTreeDataProvider?.refresh();
      return vscode.commands.executeCommand(`${STARTUP_MACROS_VIEW_ID}.focus`);
  }
}
