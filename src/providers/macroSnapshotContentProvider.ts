import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../core/execution/sandboxExecutionDescriptor';
import { ExtensionContext } from '../extensionContext';

export function registerMacroSnapshotContentProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.workspace.registerTextDocumentContentProvider('macro-snapshot', {
      provideTextDocumentContent(snapshotUri: vscode.Uri) {
        const uri = vscode.Uri.parse(snapshotUri.path, true);
        const executor = context.sandboxManager.getExecutor(uri);
        if (executor) {
          for (const instance of executor.executions) {
            if (instance.id === snapshotUri.fragment) {
              return instance.snapshot.rawCode;
            }
          }
        }
        return;
      },
    }),
  );
}

export function createSnapshotUri({ id, macro }: SandboxExecutionDescriptor) {
  return vscode.Uri.from({
    scheme: 'macro-snapshot',
    path: macro.uri.toString(),
    fragment: id,
  });
}
