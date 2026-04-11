// @ts-nocheck
// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

import * as vscode from 'vscode';

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml(): string {
  const { ui } = macros.window;
  return ui
    .root(
      { logRelay: true },
      ui.text('Error message'),
      ui.input({ id: 'errorMessage', placeholder: 'Type an error message …' }),
      ui.button(
        { id: 'errorButton', label: 'Error' },
        ui.onHandle('click', () => {
          // This code is executed in the context of the Webview, not the macro.
          const input = document.getElementById('errorMessage') as
            | (HTMLElement & { value: string })
            | null;
          const message = input?.value;
          macro.error(message || 'Did you forget to type an error message?');
          macro.log.info('Error message:', message);
        }),
      ),
    )
    .toHtml();
}

function createWebviewViewProvider(): vscode.WebviewViewProvider {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.title = 'Macro: UI DSL Error/Log Relay';
      webviewView.webview.html = createHtml();
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'macro:error':
            vscode.window.showErrorMessage(message.error?.message || 'Missing error message', {
              modal: true,
              detail: 'This a message posted on error from the WebView!',
            });
            break;
          case 'macro:log':
            macros.log.show();
            macros.window.handleLogMessage(message);
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true,
      };
    },
  };
}

// Keep macro alive until view is disposed (or use `@macro: retained`)
new Promise<void>((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window
      .showInformationMessage(`Macro ${__runId} could not claim a Webview ID`)
      .then(() => resolve());
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
