
__disposables.push({
  // Do not await to avoid blocking clean-up logic. 
  dispose: () => vscode.window.showInformationMessage(`Disposed ${__runId}`),
});

vscode.window.showInformationMessage("Dispose logic will be called when this dialog is dismissed");