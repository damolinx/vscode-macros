// @ts-nocheck

vscode.window.withProgress({
  title: `Cancel '${__runId}' using the 'Macro Explorer' or 'Show Running Macros' command`,
  location: vscode.ProgressLocation.Notification,
  cancellable: true,
},
  (progress, token) => new Promise((resolve) => {
    token.onCancellationRequested(resolve);

    __cancellationToken.onCancellationRequested(() => {
      let countdown = 3;

      const interval = setInterval(() => {
        progress.report({ message: `canceling in ${countdown}s …` });
        countdown--;

        if (countdown < 0) {
          clearInterval(interval);
          resolve(undefined);
        }
      }, 1000);
    });
  }));