import * as vscode from 'vscode';
import { SandboxExecutor } from '../core/execution/executors/sandboxExecutor';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { MacroCode } from '../core/macroCode';
import { MacroFilter } from '../utils/ui';
import { showMacroErrorMessage } from './errors';
import { selectMacroFile } from './selectMacroFile';
import { OpenMacroOptions } from './ui';

export function showMacroErrorDialog(
  executor: SandboxExecutor,
  macroCode: MacroCode,
  error: Error | string,
): Promise<void> {
  return showMacroErrorMessage(executor, macroCode, error);
}

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
