import * as vscode from 'vscode';
import { basename } from 'path';
import { pickMacroFile } from '../common/ui';
import { Manager } from '../manager';

export async function showRunningMacros(manager: Manager) {
  const runningItems = manager.runningMacros.map(
    (runInfo) => ({
      description: runInfo.runId,
      detail: runInfo.macro.uri.fsPath,
      label: basename(runInfo.macro.uri.fsPath),
      runInfo,
    }),
  );
  if (runningItems.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  const selected = await pickMacroFile(
    runningItems.map((item) => item.runInfo.macro.uri),
    { hideOpen: true }
  );
  if (!selected) {
    return; // Nothing to do
  }

  vscode.window.showInformationMessage('Running macros have no available actions');
}
