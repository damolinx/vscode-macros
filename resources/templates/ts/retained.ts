// @ts-nocheck
// @macro:retained
import * as vscode from 'vscode';

// In retained mode, the macro isn’t disposed when the script finishes,
// allowing long-lived listeners or providers. To stop it, use the
// `Macros: Show Running Macros` command.

__disposables.push(
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      vscode.window.showInformationMessage(
        `Active editor: ${vscode.workspace.asRelativePath(editor.document.uri)}. ` +
        `Macro ${__runId} must be manually stopped for this listener to be disposed.`);
    }
  }), {
  dispose: () => vscode.window.showInformationMessage(`Disposed ${__runId}`),
});