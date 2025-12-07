import * as vscode from 'vscode';
import { UriLocator } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

export async function revealInOS(locator?: UriLocator): Promise<void> {
  const uri = getUriOrTreeSelection(locator);
  if (!uri) {
    return;
  }

  const cmd = vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
  await vscode.commands.executeCommand(cmd, uri);
}
