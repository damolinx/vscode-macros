import * as vscode from 'vscode';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function revealFileInOs(locator: Locator): Promise<void> {
  const uri = toUri(fromLocator(locator));
  const command =
    vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
  await vscode.commands.executeCommand(command, uri);
}
