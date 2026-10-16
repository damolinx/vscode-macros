import * as vscode from 'vscode';
import { Context } from '../context';
import { showMacroQuickPick } from '../ui/dialogs';
import { setStartupMacro } from './setStartupMacro';

export async function addStartupMacro(
  context: Context,
  target?: vscode.ConfigurationTarget,
): Promise<void> {
  const macro = await showMacroQuickPick(context.libraryManager, {
    hideOpen: true,
    hideOpenPerItem: true,
  });
  if (!macro) {
    return;
  }

  await setStartupMacro(context, macro, target);
}
