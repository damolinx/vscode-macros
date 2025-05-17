
// @macro:singleton

// Learn about the Webview API at https://code.visualstudio.com/api/extension-guides/webview

// Available: "macrosView.webview1", "macrosView.webview2", "macrosView.webview3"
const viewId = "macrosView.webview1";

function createHtml() {
  return `<!DOCTYPE html>
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

function createWebview(resolve) {
  __disposables.push(
    vscode.window.registerWebviewViewProvider(viewId, {
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
    }),
  );
}

// Keep script alive until the webview is disposed
new Promise((resolve) => {
  createWebview(resolve);

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});