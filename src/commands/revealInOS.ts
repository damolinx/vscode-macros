import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { exists } from '../utils/fsEx';
import { formatDisplayUri } from '../utils/ui';
import { UriLocator } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

export async function revealInOS({ log }: ExtensionContext, locator?: UriLocator): Promise<void> {
  const uri = getUriOrTreeSelection(locator);
  if (!uri) {
    return;
  }

  const formattedUri = formatDisplayUri(uri);
  if (!(await exists(uri))) {
    log.warn('Cannot reveal path (not found)', formattedUri);
    vscode.window.showWarningMessage(`Path not found: ${formattedUri}`);
    return;
  }

  log.info('Reveal path', formattedUri);
  const cmd = vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
  await vscode.commands.executeCommand(cmd, uri);
}
