import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { setupSourceDirectory } from './setupSourceDirectory';

export async function createLibrary(context: ExtensionContext) {
  const selection = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: 'Select Folder',
  });
  if (!selection?.length) {
    return;
  }

  const [addResult, _setupResult] = await Promise.allSettled([
    context.libraryManager.sourcesManager.addLibrary(selection[0]),
    setupSourceDirectory(context, selection[0], true),
  ]);

  if (addResult.status === 'fulfilled') {
    const { added, target: scope } = addResult.value;
    context.log.info(added ? 'Added library result —' : 'Library already registered —', scope);
  } else {
    context.log.error('Failed to add library —', addResult.reason);
    vscode.window.showErrorMessage(`Failed to add folder: ${addResult.reason}`);
  }
}
