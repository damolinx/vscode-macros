import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { ExplorerTreeDataProvider, TreeElement } from './explorerTreeDataProvider';
import { ExplorerTreeDragAndDropController } from './explorerTreeDragAndDropController';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';

export let explorerTreeDataProvider: ExplorerTreeDataProvider | undefined;
export let explorerTreeView: vscode.TreeView<TreeElement> | undefined;

export function registerExplorerTreeview(context: ExtensionContext): void {
  explorerTreeDataProvider = new ExplorerTreeDataProvider(context);
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
    }),
  );
}
