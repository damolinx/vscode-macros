import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { MacroExplorerTreeDataProvider } from './macroExplorerTreeDataProvider';
import { MacroExplorerTreeDragAndDropController } from './macroExplorerTreeDragAndDropController';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';

export let explorerTreeDataProvider: MacroExplorerTreeDataProvider | undefined;
export let explorerTreeView: vscode.TreeView<MacroLibrary | Macro | MacroRunInfo> | undefined;

export function registerMacroExplorerTreeview(context: ExtensionContext): vscode.Disposable[] {
  explorerTreeDataProvider = new MacroExplorerTreeDataProvider(context);
  explorerTreeView = vscode.window.createTreeView(MACRO_EXPLORER_VIEW_ID, {
    dragAndDropController: new MacroExplorerTreeDragAndDropController(context),
    showCollapseAll: true,
    treeDataProvider: explorerTreeDataProvider,
  });

  return [
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
  ];
}
