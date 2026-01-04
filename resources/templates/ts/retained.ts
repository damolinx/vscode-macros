// @ts-nocheck
// @macro: retained
//   retained  – keeps the macro context alive until explicitly stopped

// The macro context isn’t disposed when the script finishes; it must be
// explicitly stopped via the "Macros: Show Running Macros" command or the
//  "Request to Stop" action in the Macro Explorer.

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