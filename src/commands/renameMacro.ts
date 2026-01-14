import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { Macro } from '../core/macro';
import { isMacro } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { existsFile } from '../utils/fsEx';
import { isUntitled, parentUri, uriBasename, UriLocator } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

export async function renameMacro(_context: ExtensionContext, locator?: UriLocator): Promise<void> {
  const uri = getUriOrTreeSelection(
    locator,
    (uri, treeItem) => !isUntitled(uri) && (!treeItem || treeItem instanceof Macro),
  );
  if (!uri) {
    return;
  }

  const parent = parentUri(uri);
  const currentName = uriBasename(uri);
  const newName = await showRenameInputBox(currentName, parent);

  if (newName && newName !== currentName) {
    await vscode.workspace.fs.rename(uri, vscode.Uri.joinPath(parent, newName));
  }
}

async function showRenameInputBox(name: string, parentUri: vscode.Uri) {
  const newName = await vscode.window.showInputBox({
    prompt: `Provide a new name for '${name}'`,
    value: name,
    valueSelection: [0, basename(basename(name, extname(name)), '.macro').length],
    validateInput: async (value) => {
      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        return 'A name must be provided.';
      } else if (normalizedValue === name) {
        return;
      } else if (!/^[^/\\:*?"<>|]+$/.test(normalizedValue)) {
        return 'This is not a valid name.';
      } else if (!isMacro(normalizedValue)) {
        return "This file extension doesn't match a supported macro language.";
      } else if (await existsFile(vscode.Uri.joinPath(parentUri, normalizedValue))) {
        return 'A file or folder with the same name already exists.';
      }
      return;
    },
  });

  return newName?.trim();
}
