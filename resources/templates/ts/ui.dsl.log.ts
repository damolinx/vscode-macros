// @ts-nocheck
// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

import * as vscode from 'vscode';

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml(): string {
  const { ui } = macros.window;
  const html = ui
    .root(
      { logRelay: true },
      ui.text('Log message'),
      ui.input({ id: 'logMessage', placeholder: 'Type a log message …' }),
      ui.button(
        { label: 'Log' },
        ui.onHandle('click', () => {
          // This code is executed in the context of the Webview, not the macro.
          const input = document.getElementById('logMessage') as
            | (HTMLElement & { value: string })
            | null;
          macro.log.info('Log received message:', input?.value.trim() || 'No message');
        }),
      ),
    )
    .toHtml();
  return html;
}

function createWebviewViewProvider(viewId: string): vscode.WebviewViewProvider {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'macro:log':
            macros.log.show();
            macros.window.handleLogMessage(message);
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true,
      };
      webviewView.title = 'Macro: UI DSL Log Relay';
      webviewView.webview.html = createHtml();
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
    vscode.window.registerWebviewViewProvider(viewId, createWebviewViewProvider(viewId)),
    { dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false) },
  );

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});
