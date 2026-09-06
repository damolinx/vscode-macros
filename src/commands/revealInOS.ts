import * as vscode from 'vscode';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { exists } from '../utils/fsEx';
import { formatDisplayUri } from '../utils/ui';
import { resolveUri, UriLocator } from '../utils/uri';
import { getTreeSelection } from './utils';

export async function revealInOS(
  { explorerTree, log }: ExtensionContext,
  locator?: UriLocator,
): Promise<void> {
  let uri = locator ? resolveUri(locator) : getTreeSelection(explorerTree);
  if (!uri) {
    log.info('RevealInOS: Nothing to reveal');
    return;
  }

  uri = getMacroUriFromStartupMacroUri(uri);
  const formattedUri = formatDisplayUri(uri);
  if (!(await exists(uri))) {
    log.warn('Cannot reveal path (not found)', formattedUri);
    vscode.window.showWarningMessage(`Path not found: ${formattedUri}`);
    return;
  }

  log.info('RevealInOS: Reveal path', formattedUri);
  const cmd = vscode.env.remoteName === 'wsl' ? 'remote-wsl.revealInExplorer' : 'revealFileInOS';
  await vscode.commands.executeCommand(cmd, uri);
}
