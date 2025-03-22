async function waitForCancellation() {
  return vscode.window.withProgress(
    {
      title: `Cancel '${__runId}' using 'Show Running Macros' command …`,
      location: vscode.ProgressLocation.Notification,
      cancellable: true
    },
    (progress, token) => new Promise((resolve) => {
      token.onCancellationRequested(() => resolve('Cancelled from notification'));
      __cancellationToken.onCancellationRequested(() => resolve("Cancelled from 'Show Running Macros'"));
    })
  );
}

waitForCancellation().then((result) => vscode.window.showInformationMessage(result));
