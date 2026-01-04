import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { showMacroQuickPick } from '../ui/dialogs';
import { setStartupMacro } from './setStartupMacro';

export async function addStartupMacro(
  context: ExtensionContext,
  target?: vscode.ConfigurationTarget,
): Promise<void> {
  const macro = await showMacroQuickPick(context.libraryManager, {
    hideOpen: true,
    hideOpenPerItem: true,
  });
  if (!macro) {
    return; // User canceled
  }

  await setStartupMacro(context, macro, target);
}
