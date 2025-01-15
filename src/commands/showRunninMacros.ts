import * as vscode from 'vscode';
import { basename } from 'path';
import { pickMacroFile } from '../common/ui';
import { Macro } from '../macro';
import { Manager } from '../manager';

export async function showRunningMacros(manager: Manager) {
  const runningItems = manager.runningMacros.map(
    (runInfo) =>
      <vscode.QuickPickItem & { runInfo: { macro: Macro; runId: string } }>{
        description: runInfo.runId,
        detail: runInfo.macro.uri.fsPath || runInfo.macro.uri.toString(true),
        label: basename(runInfo.macro.uri.toString()),
        runInfo: runInfo,
      },
  );
  if (runningItems.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  const selected = await pickMacroFile(runningItems.map((item) => item.runInfo.macro.uri).sort());
  if (!selected) {
    return; // Nothing to do
  }

  vscode.window.showInformationMessage('Running macros have no available actions');
}
