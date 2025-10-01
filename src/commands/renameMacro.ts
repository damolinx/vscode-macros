import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { isMacro } from '../core/language';
import { Macro } from '../core/macro';
import { explorerTreeView } from '../explorer/macroExplorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, isUntitled, Locator, parent, toUri, uriBasename } from '../utils/uri';

export async function renameMacro(context: ExtensionContext, locator?: Locator): Promise<void> {
  let targetLocator = locator;
  if (!targetLocator) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection instanceof Macro && !isUntitled(treeSelection.uri)) {
      targetLocator = treeSelection;
    }
  }

  if (targetLocator) {
    await renameFromLocator(context, targetLocator);
  }
}

async function renameFromLocator(_context: ExtensionContext, locator: Locator): Promise<void> {
  const uri = toUri(fromLocator(locator));
  const name = uriBasename(uri);
  const parentUri = parent(uri);
  const newName = await vscode.window.showInputBox({
    prompt: `Provide a new name for '${name}'`,
    placeHolder: 'File name',
    value: name,
    valueSelection: [0, basename(basename(name, extname(name)), '.macro').length],
    validateInput: async (value) => {
      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        return 'Name cannot be empty';
      } else if (normalizedValue === name) {
        return 'Name cannot be the current name';
      } else if (!/^[a-zA-Z0-9_.@()-]+$/.test(normalizedValue)) {
        return 'Invalid file name';
      } else if (!isMacro(normalizedValue)) {
        return 'Invalid macro file name';
      } else if (await exists(vscode.Uri.joinPath(parentUri, normalizedValue))) {
        return 'A file or folder with the same name already exists';
      }
      return;
    },
  });
  if (newName) {
    await vscode.workspace.fs.rename(uri, vscode.Uri.joinPath(parentUri, newName));
  }

  function exists(uri: vscode.Uri) {
    return vscode.workspace.fs.stat(uri).then(
      () => true,
      () => false,
    );
  }
}
