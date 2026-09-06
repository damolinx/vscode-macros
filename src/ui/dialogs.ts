import * as vscode from 'vscode';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { MacroFilter } from '../utils/ui';
import { selectMacroFile } from './selectMacroFile';
import { MacroQuickPickOptions } from './ui';

export async function showMacroOpenDialog(
  options?: vscode.OpenDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: MacroFilter,
    ...options,
  });

  return selectedUris?.[0];
}

export async function showMacroQuickPick(
  manager: MacroLibraryManager,
  options?: MacroQuickPickOptions,
): Promise<vscode.Uri | undefined> {
  return selectMacroFile(manager, options);
}
