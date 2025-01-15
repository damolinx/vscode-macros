import * as vscode from 'vscode';
import { Macro } from '../macro';
import { Manager } from '../manager';
import { basename } from 'path';

export async function showRunningMacros(manager: Manager) {
  const stoppableItems = manager.runningMacros.map(
    (runInfo) =>
      <vscode.QuickPickItem & { runInfo: { macro: Macro; runId: string } }>{
        description: runInfo.runId,
        detail: runInfo.macro.uri.fsPath || runInfo.macro.uri.toString(true),
        label: basename(runInfo.macro.uri.toString()),
        runInfo: runInfo,
      },
  );

  if (stoppableItems.length) {
    vscode.window.showQuickPick(stoppableItems);
  } else {
    vscode.window.showInformationMessage('No running macros');
  }
}
