import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { isUntitled } from '../utils/uri';
import { MacroExplorerTreeDataProvider, TreeElement } from './macroExplorerTreeDataProvider';
import { MacroExplorerTreeDragAndDropController } from './macroExplorerTreeDragAndDropController';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';

export function registerMacroExplorerTreeview(context: ExtensionContext): vscode.Disposable[] {
  const treeProvider = new MacroExplorerTreeDataProvider(context);
  const treeView = vscode.window.createTreeView(MACRO_EXPLORER_VIEW_ID, {
    dragAndDropController: new MacroExplorerTreeDragAndDropController(context),
    treeDataProvider: treeProvider,
  });

  return [
    treeProvider,
    treeView,
    treeProvider.onDidChangeTreeData((elementOrElements) => {
      if (elementOrElements) {
        const target =
          elementOrElements instanceof Array
            ? elementOrElements.findLast(isUntitledMacro)
            : isUntitledMacro(elementOrElements)
              ? elementOrElements
              : undefined;
        if (target) {
          treeView.reveal(target);
        }
      }
    }),
  ];

  function isUntitledMacro(e: TreeElement) {
    return e instanceof Macro && isUntitled(e);
  }
}
