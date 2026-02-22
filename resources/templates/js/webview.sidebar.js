
// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webview Sidebar</title>
    <style>
      button {
        background-color: var(--vscode-button-background);
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: 2px;
        color: var(--vscode-button-foreground);
        margin-bottom: 8px;
        padding: 4px 12px;
        width: 100%;
      }
      button:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 1px;
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>
  <body>
    <p>Closing this webview disposes its supporting macro as well.</p>
    <button id="closeButton">Close</button>

    <script>
      const vscode = acquireVsCodeApi();
      const closeButton = document.getElementById('closeButton');

      closeButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'close' });
      });
    </script>
  </body>
</html>`;
}

/**
 * @param {string} viewId - The ID of the view to create.
 * @param {(value: any) => void} resolve - Promise resolver.
 * @returns {import('vscode').WebviewViewProvider }
 */
function createWebviewViewProvider(viewId, resolve) {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.webview.html = createHtml();
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case 'close':
            vscode.commands.executeCommand('setContext', `${viewId}.show`, false);
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true
      };
      webviewView.title = `Macro ${__runId}`;
    }
  };
}

// Keep macro alive until view is disposed (or use `@macro: retained`)
new Promise((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window.showInformationMessage(
      `Macro ${__runId} could not claim a Webview ID`,
    ).then(resolve);
    return;
  }

  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    vscode.window.registerWebviewViewProvider(
      viewId,
      createWebviewViewProvider(viewId, resolve)),
    { dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false) },
  );

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});