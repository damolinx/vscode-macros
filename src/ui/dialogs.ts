import * as vscode from 'vscode';
import { MACROS_FILTER } from '../core/constants';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { MacroOptions } from '../core/macroOptions';
import { showMacroErrorMessage } from './errors';
import { selectMacroFile } from './selectMacroFile';
import { OpenMacroOptions } from './ui';

export function showMacroErrorDialog(
  runner: MacroRunner,
  macroOptions: MacroOptions,
  error: Error | string,
): Promise<void> {
  return showMacroErrorMessage(runner, macroOptions, error);
}

export async function showMacroOpenDialog(
  options?: vscode.OpenDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    filters: MACROS_FILTER,
    ...options,
  });

  return selectedUris?.pop();
}

export async function showMacroSaveDialog(
  options?: vscode.SaveDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUri = await vscode.window.showSaveDialog({
    filters: MACROS_FILTER,
    ...options,
  });

  return selectedUri;
}

export async function showMacroQuickPick(
  manager: MacroLibraryManager,
  options?: OpenMacroOptions,
): Promise<vscode.Uri | undefined> {
  return selectMacroFile(manager, options);
}
