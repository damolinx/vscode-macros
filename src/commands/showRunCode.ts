import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { createSnapshotUri } from '../providers/macroSnapshotContentProvider';

export async function showRunCode(runInfo: MacroRunInfo) {
  const macroDocument = await vscode.workspace.openTextDocument(runInfo.macro.uri);
  if (macroDocument.version === runInfo.snapshot.version) {
    await vscode.window.showTextDocument(macroDocument);
  } else {
    const snapshotUri = createSnapshotUri(runInfo);
    await vscode.commands.executeCommand(
      'vscode.diff',
      snapshotUri,
      runInfo.macro.uri,
      `${runInfo.macro.name}: v${runInfo.snapshot.version} (running) vs v${macroDocument.version} (current)`,
    );
  }
}
