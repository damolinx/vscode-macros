// @ts-nocheck
// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

import * as vscode from 'vscode';

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml(): string {
  const { ui } = macros.window;
  return ui
    .root(
      ui.container(
        { mode: 'fixed' },
        ui.input(
          { id: 'search', placeholder: 'Search' },
          ui.onHandle('input', ({ value }) => {
            // This logs to the Developer Tools console
            console.log('Input changed:', value);
          }),
          ui.button({ id: 'caseButton', label: 'Aa', toggle: true }),
        ),
        ui.button(
          { id: 'searchButton', label: 'Search' },
          ui.onHandle('click', () => {
            // This logs to the Developer Tools console
            console.log('Search clicked');
          }),
        ),
      ),
      ui.tree(
        {
          id: 'exampleTree',
          remove: true,
          initialItems: [
            {
              id: 'root',
              label: 'Root',
              children: [{ id: 'child1', label: 'Child 1' }],
            },
          ],
        },
        ui.onHandle('activate', ({ item }) => {
          // This logs to the Developer Tools console
          console.log('Node activated:', item);
        }),
      ),
    )
    .toHtml();
}

function createWebviewViewProvider(viewId: string): vscode.WebviewViewProvider {
  return {
    resolveWebviewView: (webviewView) => {
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case 'close':
            vscode.commands.executeCommand('setContext', `${viewId}.show`, false);
            break;
        }
      });
      webviewView.webview.options = {
        enableScripts: true,
      };
      webviewView.webview.html = createHtml();
      webviewView.title = 'Macro: UI DSL Layout';
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
