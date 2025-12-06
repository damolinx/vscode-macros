import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { ExtensionContext } from '../extensionContext';

export function registerMacroSnapshotContentProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.workspace.registerTextDocumentContentProvider('macro-snapshot', {
      provideTextDocumentContent(snapshotUri: vscode.Uri) {
        const uri = vscode.Uri.parse(snapshotUri.path, true);
        const runner = context.runnerManager.getRunner(uri);
        if (runner) {
          for (const instance of runner.runInstances) {
            if (instance.runId === snapshotUri.fragment) {
              return instance.snapshot.code;
            }
          }
        }
        return;
      },
    }),
  );
}

export function createSnapshotUri(runInfo: MacroRunInfo) {
  return vscode.Uri.from({
    scheme: 'macro-snapshot',
    path: runInfo.macro.uri.toString(),
    fragment: runInfo.runId,
  });
}
