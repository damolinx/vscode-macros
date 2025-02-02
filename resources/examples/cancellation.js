
async function waitForCancellation() {
  return vscode.window.withProgress(
    {
      title: `Cancel '${__runId}' from 'Show Running Macros' command …`,
      location: vscode.ProgressLocation.Notification,
      cancellable: true
    },
    (progress, token) => {
      return new Promise((resolve, _reject) => {
        token.onCancellationRequested(() => {
          resolve('Cancelled from notification dialog');
        });
        __cancellationToken.onCancellationRequested(() => {
          resolve('Cancelled from extension');
        });
      });
    });
}

waitForCancellation().then((result) => vscode.window.showInformationMessage(result));
