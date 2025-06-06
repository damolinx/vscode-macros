
// Learn about the Webview API at https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webview Example</title>
    <style>
      button {
        background: var(--vscode-button-background);
        border: 1px solid var(--vscode-button-border,transparent);
        color: var(--vscode-button-foreground);
        padding: 4px;
        text-align: center;
      }
      button:hover {
        background: var(--vscode-button-hoverBackground);
      }
      button:focus {
        outline-color: var(--vscode-focusBorder);
      }
    </style>
  </head>
  <body>
    <h1>Hello from Webview</h1>
    <button id="sendButton">Send Message</button>

    <script>
      const vscode = acquireVsCodeApi();
      const sendButton = document.getElementById('sendButton');

      sendButton.addEventListener('click', () => {
        vscode.postMessage({ text: 'Hello from your Webview!' });
      });
    </script>
  </body>
</html>`;
}

function createWebview(resolve) {
  const panel = vscode.window.createWebviewPanel(
    'mywebview.id',
    'My Webview',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
    },
  );
  panel.onDidDispose(resolve);

  panel.webview.html = createHtml();
  panel.webview.onDidReceiveMessage((message) =>
    vscode.window.showInformationMessage(message.text),
  );
  return panel;
}

// Keep macro alive until view is disposed.
new Promise((resolve) => {
  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(createWebview(resolve));
});