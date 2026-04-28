import * as vscode from 'vscode';
import { Execution } from '../core/execution/execution';
import { ExtensionContext } from '../extensionContext';

export function registerMacroSnapshotContentProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.workspace.registerTextDocumentContentProvider('macro-snapshot', {
      provideTextDocumentContent(snapshotUri: vscode.Uri) {
        const uri = vscode.Uri.parse(snapshotUri.path, true);
        const executor = context.sandboxManager.getExecutor(uri);
        if (executor?.executionCount) {
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

export function createSnapshotUri({ id, macro: { uri } }: Execution): vscode.Uri {
  return vscode.Uri.from({
    scheme: 'macro-snapshot',
    path: uri.toString(),
    fragment: id,
  });
}
