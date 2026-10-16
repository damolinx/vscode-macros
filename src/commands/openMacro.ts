import * as vscode from 'vscode';
import { Context } from '../context';
import { showMacroQuickPick } from '../ui/dialogs';
import { UriLocator, resolveUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export async function openMacro(
  { libraryManager }: Context,
  locator?: UriLocator,
): Promise<vscode.TextEditor | undefined> {
  const uri = locator
    ? resolveUri(locator)
    : await showMacroQuickPick(libraryManager, {
        hideOpenPerItem: true,
        placeHolder: 'Select a macro to open',
      });
  if (!uri) {
    return;
  }

  const editor = await showTextDocument(uri);
  return editor;
}
