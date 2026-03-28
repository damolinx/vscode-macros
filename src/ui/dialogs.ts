import * as vscode from 'vscode';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { MacroFilter } from '../utils/ui';
import { selectMacroFile } from './selectMacroFile';
import { OpenMacroOptions } from './ui';

export async function showMacroOpenDialog(
  options?: vscode.OpenDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    filters: MacroFilter,
    ...options,
  });

  return selectedUris?.pop();
}

export async function showMacroQuickPick(
  manager: MacroLibraryManager,
  options?: OpenMacroOptions,
): Promise<vscode.Uri | undefined> {
  return selectMacroFile(manager, options);
}
