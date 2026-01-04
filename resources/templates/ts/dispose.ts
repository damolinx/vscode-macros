// @ts-nocheck
import * as vscode from 'vscode';

__disposables.push({
  dispose: () => vscode.window.showInformationMessage(`Disposed ${__runId}`),
});

// Returns a Promise, so the macro’s disposal is deferred until it resolves.
vscode.window.showInformationMessage(
  `Macro ${__runId} will be disposed only after this notification is dismissed`,
);