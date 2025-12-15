import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../core/execution/sandboxExecutionDescriptor';
import { createSnapshotUri } from '../providers/macroSnapshotContentProvider';
import { showTextDocument } from '../utils/vscodeEx';

export async function showRunCode(descriptor: SandboxExecutionDescriptor) {
  const macroDocument = await vscode.workspace.openTextDocument(descriptor.macro.uri);
  if (macroDocument.version === descriptor.snapshot.version) {
    await showTextDocument(macroDocument.uri);
  } else {
    const snapshotUri = createSnapshotUri(descriptor);
    await vscode.commands.executeCommand(
      'vscode.diff',
      snapshotUri,
      descriptor.macro.uri,
      `${descriptor.macro.name}: v${descriptor.snapshot.version} (running) vs v${macroDocument.version} (current)`,
    );
  }
}
