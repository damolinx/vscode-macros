import * as vscode from 'vscode';
import { Execution } from '../core/execution/execution';
import { createSnapshotUri } from '../providers/macroSnapshotContentProvider';
import { showTextDocument } from '../utils/vscodeEx';

export async function showRunCode(execution: Execution): Promise<void> {
  const macroDocument = await vscode.workspace.openTextDocument(execution.macro.uri);
  if (macroDocument.version === execution.snapshot.version) {
    await showTextDocument(macroDocument.uri);
  } else {
    const snapshotUri = createSnapshotUri(execution);
    await vscode.commands.executeCommand(
      'vscode.diff',
      snapshotUri,
      execution.macro.uri,
      `${execution.macro.name}: v${execution.snapshot.version} (running) vs v${macroDocument.version} (current)`,
    );
  }
}
