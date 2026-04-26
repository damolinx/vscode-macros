vscode.window.withProgress(
  {
    title: `Cancel '${__runId}' using the 'Macro Explorer' or 'Show Running Macros' command`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true,
  },
  (progress, token) =>
    new Promise((resolve) => {
      // React to Cancel button from progress notification
      token.onCancellationRequested(resolve);

      // React to stop-request for the macro
      __cancellationToken.onCancellationRequested(resolve);

      // Wait for either cancellation to dismiss notification
      progress.report({ message: 'Waiting …' });
    }),
);
