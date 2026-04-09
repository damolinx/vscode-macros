// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  const { ui } = macros.window;
  return ui
    .root(
      ui.text('Error message'),
      ui.input({ id: 'errorMessage', placeholder: 'Type an error message …' }),
      ui.button(
        { id: 'errorButton', label: 'Error' },
        ui.onHandle('click', () => {
          // This code is executed in the context of the Webview, not the macro.
          const input = /** @type {HTMLElement & { value: string } | null} */ (
            document.getElementById('errorMessage')
          );
          macro.error(input?.value || 'Did you forget to type an error message?');
        }),
      ),
    )
    .toHtml();
}

/**
 * @returns {import('vscode').WebviewViewProvider }
 */
function createWebviewViewProvider() {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'macro:error':
            vscode.window.showErrorMessage(message.error?.message || 'Missing error message', {
              modal: true,
              detail: 'This a message posted on error from the WebView!',
            });
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true,
      };
      webviewView.webview.html = createHtml();
      webviewView.title = 'Macro: UI DSL Error Relay';
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
    vscode.window.registerWebviewViewProvider(viewId, createWebviewViewProvider()),
    { dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false) },
  );

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});
