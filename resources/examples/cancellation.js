
async function main() {
  const result = await vscode.window.withProgress({
    title: `Cancel '${__runId}' using 'Show Running Macros' command …`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true,
  },
    (progress, token) => new Promise((resolve) => {
      token.onCancellationRequested(() => {
        progress.message = 'Canceled from notification';
        resolve();
      });
      __cancellationToken.onCancellationRequested(() => {
        progress.message = 'Canceled from \'Show Running Macros\'';
        resolve();
      });
    }));
}

main();
