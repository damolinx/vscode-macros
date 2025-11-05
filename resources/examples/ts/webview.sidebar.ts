// @ts-nocheck
// @macro: singleton
//   singleton – ensures no more than one instance runs at a time

import * as vscode from "vscode";

// References:
//   - Webview API: https://code.visualstudio.com/api/extension-guides/webview

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

function createWebviewViewProvider(viewId: string, resolve: () => void) {
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

// Keep macro alive until view is disposed (or use `@macro: retained`)
new Promise<void>((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window.showInformationMessage(
      `Macro ${__runId} could not claim a Webview ID`,
    ).then(() => resolve());
    return;
  }

  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    vscode.window.registerWebviewViewProvider(
      viewId,
      createWebviewViewProvider(viewId, resolve)), {
    dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false)
  });

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});