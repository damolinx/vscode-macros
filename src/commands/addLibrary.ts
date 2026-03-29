import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { formatDisplayUri } from '../utils/ui';
import { resolveUri, UriLocator } from '../utils/uri';
import { setupSourceDirectory } from './setupSourceDirectory';

export async function addLibrary(context: ExtensionContext, locator?: UriLocator): Promise<void> {
  const uri = locator ? resolveUri(locator) : await pickFolder();
  if (!uri) {
    return;
  }

  const [addResult, _setupResult] = await Promise.allSettled([
    context.libraryManager.sourcesManager.addLibrary(uri),
    setupSourceDirectory(context, uri, true),
  ]);

  if (addResult.status === 'fulfilled') {
    const { added, target } = addResult.value;
    context.log.info(
      added ? 'Added folder' : 'Folder already registered',
      vscode.ConfigurationTarget[target],
      formatDisplayUri(uri),
    );
  } else {
    context.log.error('Failed to add folder', formatDisplayUri(uri), addResult.reason);
    vscode.window.showErrorMessage(`Failed to add folder. ${addResult.reason}`);
  }
}

async function pickFolder(): Promise<vscode.Uri | undefined> {
  const selection = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    openLabel: 'Select Folder',
  });
  return selection?.at(0);
}
