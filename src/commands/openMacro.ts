import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { showMacroQuickPick } from '../ui/dialogs';
import { UriLocator, resolveUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export async function openMacro(
  { libraryManager }: ExtensionContext,
  locator?: UriLocator,
): Promise<vscode.TextEditor | undefined> {
  const uri = locator
    ? resolveUri(locator)
    : await showMacroQuickPick(libraryManager, { hideOpenPerItem: true });
  if (!uri) {
    return; // Nothing to open.
  }

  const editor = await showTextDocument(uri);
  return editor;
}
