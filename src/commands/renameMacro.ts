import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { Macro } from '../core/macro';
import { isMacro } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { exists } from '../utils/fsEx';
import { isUntitled, parentUri, resolveUri, uriBasename, UriLocator } from '../utils/uri';
import { getTreeSelection } from './utils';

export async function renameMacro(
  { explorerTree, log }: ExtensionContext,
  locator?: UriLocator,
): Promise<void> {
  const uri = locator
    ? resolveUri(locator)
    : getTreeSelection(explorerTree, (item) => item instanceof Macro && !isUntitled(item.uri));
  if (!uri) {
    log.info('RenameMacro: Nothing to rename');
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
        return 'This name contains invalid characters.';
      } else if (!isMacro(normalizedValue)) {
        return 'File extension must be .js or .ts';
      } else if (
        await exists(vscode.Uri.joinPath(parentUri, normalizedValue), vscode.FileType.File)
      ) {
        return 'A file or folder with this name already exists.';
      }
      return;
    },
  });

  return newName?.trim();
}
