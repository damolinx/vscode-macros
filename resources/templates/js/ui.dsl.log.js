// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  const { ui } = macros.window;
  const html = ui
    .root(
      { logRelay: true },
      ui.text('Log message'),
      ui.input({ id: 'logMessage', placeholder: 'Type a log message …' }),
      ui.button(
        { label: 'Log' },
        ui.onHandle('click', () => {
          // This code is executed in the context of the Webview, not the macro.
          const input = /** @type {HTMLElement & { value: string } | null} */ (
            document.getElementById('logMessage')
          );
          macro.log.info('Log received message:', input?.value.trim() || 'No message');
        }),
      ),
    )
    .toHtml();
  return html;
}

/**
 * @param {string} viewId - The ID of the view to create.
 * @param {(value: any) => void} resolve - Promise resolver.
 * @returns {import('vscode').WebviewViewProvider }
 */
function createWebviewViewProvider(viewId, resolve) {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'macro:log':
            macros.log.show();
            macros.window.handleLogMessage(message);
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true,
      };
      webviewView.webview.html = createHtml();
      webviewView.title = 'Macro: UI DSL Log Relay';
    },
  };
}

// Keep macro alive until view is disposed (or use `@macro: retained`)
new Promise((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window
      .showInformationMessage(`Macro ${__runId} could not claim a Webview ID`)
      .then(resolve);
    return;
  }

  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    vscode.window.registerWebviewViewProvider(viewId, createWebviewViewProvider(viewId, resolve)),
    { dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false) },
  );

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});
