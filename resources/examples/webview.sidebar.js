
// @macro: singleton
// singleton – ensures no more than one instance runs at a time
//
// Creates a Webview editor in the editors container area.
// This example omits `retained` for simplicity as the custom
// Webview panel handles its own disposal when closed.
//
// References:
//   - Webview API: https://code.visualstudio.com/api/extension-guides/webview
//
// Available view IDs:
//   - macrosView.webview1
//   - macrosView.webview2
//   - macrosView.webview3
const viewId = "macrosView.webview1";

function createHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webview Example</title>
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

/** @returns {import('vscode').WebviewViewProvider } */
function createWebviewViewProvider(resolve) {
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
      webviewView.onDidDispose(resolve);
    }
  };
}

// Keep macro alive until view is disposed.
new Promise((resolve) => {
  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    vscode.window.registerWebviewViewProvider(
      viewId,
      createWebviewViewProvider(resolve)), {
    dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false)
  });

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});