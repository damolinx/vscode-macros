import * as vscode from 'vscode';
import { SourceTarget } from './sourceTarget';

export function createSourceTargetItem(sourceTarget: SourceTarget): vscode.TreeItem {
  let treeItem: vscode.TreeItem;

  switch (sourceTarget.target) {
    case vscode.ConfigurationTarget.Global:
      treeItem = new vscode.TreeItem('Global');
      treeItem.tooltip = new vscode.MarkdownString(
        'Macros that run whenever the current workspace changes.  \nThese are defined in [User](command:workbench.action.openSettings?%5B%22macros.startupMacros%22%5D) settings.',
      );
      treeItem.tooltip.isTrusted = true;
      break;
    case vscode.ConfigurationTarget.Workspace:
      treeItem = new vscode.TreeItem('Workspace');
      treeItem.tooltip = new vscode.MarkdownString(
        'Macros that run when this workspace is opened.  \nThese are defined in [Workspace](command:workbench.action.openWorkspaceSettings?%5B%22macros.startupMacros%22%5D) settings.',
      );
      treeItem.tooltip.isTrusted = true;
      break;
    default:
      treeItem = new vscode.TreeItem(sourceTarget.folder!.name);
      treeItem.description = '‹folder›';
      treeItem.tooltip = new vscode.MarkdownString(
        `Macros that run when this folder is opened.  \nThese are defined in [Folder: ${sourceTarget.folder!.name}](command:workbench.action.openFolderSettings?%5B%22macros.startupMacros%22%5D) settings.`,
      );
      treeItem.tooltip.isTrusted = true;
      break;
  }

  treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  treeItem.contextValue = 'startupLibrary';
  return treeItem;
}
