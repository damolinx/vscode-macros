
// Learn about the Webview API at https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webview Example</title>
  </head>
  <body>
    <h1>Hello from Webview</h1>
    <button id="sendMessageButton">Send Message</button>

    <script>
      const vscode = acquireVsCodeApi();
      const sendButton = document.getElementById('sendMessageButton');

      sendButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'alert', text: 'Hello from your Webview!' });
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
    },
  );
  panel.webview.html = html;
  return panel;
}

// Keep script alive until the webview is disposed
new Promise((resolve) => {
  const html = createHtml();
  const webview = createWebView(html);
  webview.webview.onDidReceiveMessage((message) =>
    vscode.window.showInformationMessage(message.text),
  );
  webview.onDidDispose(resolve);
});