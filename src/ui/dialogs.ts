import * as vscode from 'vscode';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { MacroCode } from '../core/macroCode';
import { macroFilter } from '../utils/ui';
import { showMacroErrorMessage } from './errors';
import { selectMacroFile } from './selectMacroFile';
import { OpenMacroOptions } from './ui';

export function showMacroErrorDialog(
  runner: MacroRunner,
  macroCode: MacroCode,
  error: Error | string,
): Promise<void> {
  return showMacroErrorMessage(runner, macroCode, error);
}

export async function showMacroOpenDialog(
  options?: vscode.OpenDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    filters: macroFilter(),
    ...options,
  });

  return selectedUris?.pop();
}

export async function showMacroSaveDialog(
  options?: vscode.SaveDialogOptions,
): Promise<vscode.Uri | undefined> {
  const selectedUri = await vscode.window.showSaveDialog({
    filters: macroFilter(),
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
