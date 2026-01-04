
__disposables.push({
  dispose: () => vscode.window.showInformationMessage(`Disposed ${__runId}`),
});

// Disposal happens only after the showInformationMessage Promise resolves.
vscode.window.showInformationMessage(
  `Macro ${__runId} will be disposed only after this notification is dismissed`,
);