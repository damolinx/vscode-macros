import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, parent, toUri, uriBasename } from '../utils/uri';
import { getMacroLangId } from '../core/language';

export async function renameMacro(_context: ExtensionContext, locator: Locator): Promise<void> {
  const uri = toUri(fromLocator(locator));
  const name = uriBasename(uri);
  const parentUri = parent(uri);
  const newName = await vscode.window.showInputBox({
    prompt: `Provide a new name for '${name}'`,
    placeHolder: 'File name',
    value: name,
    valueSelection: [0, name.lastIndexOf('.')],
    validateInput: async (value) => {
      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        return 'Name cannot be empty';
      } else if (normalizedValue === name) {
        return 'Name cannot be the current name';
      } else if (!/^[a-zA-Z0-9_.@()-]+$/.test(normalizedValue)) {
        return 'Invalid file name';
      } else if (!getMacroLangId(normalizedValue)) {
        return 'Unspported file extension';
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
