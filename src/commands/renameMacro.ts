import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { isMacro } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { existsFile } from '../utils/fsEx';
import { isUntitled, parent, uriBasename, UriLocator } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

export async function renameMacro(_context: ExtensionContext, locator?: UriLocator): Promise<void> {
  const uri = getUriOrTreeSelection(locator, (uri) => !isUntitled(uri));
  if (!uri) {
    return;
  }

  const parentUri = parent(uri);
  const newName = await showRenameInputBox(uriBasename(uri), parentUri);

  if (newName) {
    await vscode.workspace.fs.rename(uri, vscode.Uri.joinPath(parentUri, newName));
  }
}
async function showRenameInputBox(name: string, parentUri: vscode.Uri) {
  return await vscode.window.showInputBox({
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
      } else if (!/^[ a-zA-Z0-9_.@()-]+$/.test(normalizedValue)) {
        return 'Invalid file name';
      } else if (!isMacro(normalizedValue)) {
        return 'Invalid macro file name';
      } else if (await existsFile(vscode.Uri.joinPath(parentUri, normalizedValue))) {
        return 'A file or folder with the same name already exists';
      }
      return;
    },
  });
}
