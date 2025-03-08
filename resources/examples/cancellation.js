async function waitForCancellation() {
  return vscode.window.withProgress(
    {
      title: `Try cancelling '${__runId}' using the 'Show Running Macros' command …`,
      location: vscode.ProgressLocation.Notification,
      cancellable: true
    },
    (progress, token) => new Promise((resolve) => {
      token.onCancellationRequested(() => resolve('Cancelled from notification dialog'));
      __cancellationToken.onCancellationRequested(() => resolve('Cancelled from extension'));
    })
  );
}

waitForCancellation().then((result) => vscode.window.showInformationMessage(result));
