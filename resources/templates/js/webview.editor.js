
// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webview Editor</title>
    <style>
      button {
        background-color: var(--vscode-button-background);
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: 2px;
        color: var(--vscode-button-foreground);
        margin-bottom: 8px;
        padding: 4px 12px;
      }
      button:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 1px;
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }

      input[type="text"] {
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border, transparent);
        border-radius: 2px;
        box-sizing: border-box;
        color: var(--vscode-input-foreground);
        margin-bottom: 8px;
        padding: 4px 8px;
      }

      input[type="text"]:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 0;
      }
    </style>
  </head>
  <body>
    <h1>Editor</h1>
    <input id="messageInput" type="text" placeholder="Type a message…" />
    <br />
    <button id="sendButton">Send Message</button>

    <script>
      const vscode = acquireVsCodeApi();
      const sendButton = document.getElementById('sendButton');

      sendButton.addEventListener('click', () => {
        vscode.postMessage({ text: document.getElementById('messageInput').value });
      });
    </script>
  </body>
</html>`;
}

function createWebview() {
  const panel = vscode.window.createWebviewPanel(
    'mywebview.id',
    'My Webview Editor',
    vscode.ViewColumn.Active,
    { enableScripts: true },
  );

  panel.webview.html = createHtml();
  panel.webview.onDidReceiveMessage((message) =>
    vscode.window.showInformationMessage(message.text || "Nothing to say?"),
  );
  return panel;
}

// Keep macro alive until editor is closed, or macro is stopped.
new Promise((resolve) => {
  __cancellationToken.onCancellationRequested(resolve);

  const panel = createWebview();
  panel.onDidDispose(resolve);
  __disposables.push(panel);
});