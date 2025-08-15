
async function main() {
  const result = await vscode.window.withProgress({
    title: `Cancel '${__runId}' using 'Show Running Macros' command …`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true,
  },
    (progress, token) => new Promise((resolve) => {
      token.onCancellationRequested(() => resolve('Canceled from notification'));
      __cancellationToken.onCancellationRequested(() => resolve('Canceled from \'Show Running Macros\''));
    }));

  vscode.window.showInformationMessage(result);
}

main();
