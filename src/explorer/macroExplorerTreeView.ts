import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { MacroExplorerTreeDataProvider } from './macroExplorerTreeDataProvider';
import { MacroExplorerTreeDragAndDropController } from './macroExplorerTreeDragAndDropController';

export const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';

export function registerMacroExplorerTreeview(context: ExtensionContext): vscode.Disposable[] {
  const treeProvider = new MacroExplorerTreeDataProvider(context);
  const treeView = vscode.window.createTreeView(MACRO_EXPLORER_VIEW_ID, {
    dragAndDropController: new MacroExplorerTreeDragAndDropController(context),
    treeDataProvider: treeProvider,
  });

  return [treeProvider, treeView];
}
