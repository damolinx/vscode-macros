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

  if (!(await exists(uri))) {
    log.warn('Cannot reveal path (not found)', uri.toString(true));
    vscode.window.showWarningMessage(`Path not found: ${formatDisplayUri(uri)}`);
    return;
  }

  log.info('Reveal path', uri.toString(true));
  const cmd = vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
  await vscode.commands.executeCommand(cmd, uri);
}
