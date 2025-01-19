function createHtml() {
  return `
    <!DOCTYPE html> <html lang="en">
        <head> <meta charset="UTF- 8">
        <meta name="viewport" content="width = device - width, initial - scale=1.0">
        <title>Example Webview</title>
      </head>
      <body>
        <h1>Hello from Webview</h1>
        <button id="sendMessageButton">Send Message</button>
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('sendMessageButton').addEventListener('click',
            () => { vscode.postMessage({ command: 'alert', text: 'Hello from Webview!' });
          });
        </script>
      </body>
    </html>`;
}

function createWebView(html) {
  const panel = vscode.window.createWebviewPanel(
    'mywebview.id',
    'My Webview',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
    }
  );
  panel.webview.html = html;
  return panel;
}

const html = createHtml();
const webview = createWebView(html);
webview.webview.onDidReceiveMessage((message) => {
  // Process received messages
  vscode.window.showInformationMessage(message.text);
});

// Keep script alive until the webview is disposed
new Promise((resolve) => {
  webview.onDidDispose(() => {
    resolve(undefined);
  });
});