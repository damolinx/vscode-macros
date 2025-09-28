import * as vscode from 'vscode';
import { explorerTreeView } from '../explorer/macroExplorerTreeView';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function revealInOS(locator?: Locator): Promise<void> {
  let targetLocator = locator;
  if (!targetLocator) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection && 'uri' in treeSelection) {
      targetLocator = treeSelection;
    }
  }

  if (targetLocator) {
    const uri = toUri(fromLocator(targetLocator));
    const command =
      vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
    await vscode.commands.executeCommand(command, uri);
  }
}
