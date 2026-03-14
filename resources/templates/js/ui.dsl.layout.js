// @macro: singleton
//   singleton – ensures only one macro instance runs at a time

// Reference: https://code.visualstudio.com/api/extension-guides/webview

function createHtml() {
  const { ui } = macros.window;
  return ui
    .root(
      ui.container(
        { mode: 'fixed' },
        ui.input(
          { id: 'search', placeholder: 'Search' },
          ui.onHandle('input', ({ value }) => {
            console.log('Input changed:', value);
          }),
        ),
        ui.button(
          { id: 'searchButton', label: 'Search' },
          ui.on('click', 'onSearch'),
          ui.handler('onSearch', () => {
            console.log('Search clicked');
          }),
        ),
      ),
      ui.tree(
        {
          id: 'exampleTree',
          enableRemove: true,
          initialItems: [
            {
              id: 'root',
              label: 'Root',
              children: [{ id: 'child1', label: 'Child 1' }],
            },
          ],
        },
        ui.onHandle('activate', ({ item }) => {
          console.log('Node activated:', item);
        }),
      ),
    )
    .toHtml();
}

/**
 * @param {string} viewId - The ID of the view to create.
 * @returns {import('vscode').WebviewViewProvider }
 */
function createWebviewViewProvider(viewId) {
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
new Promise((resolve) => {
  const viewId = macros.window.getWebviewId();
  if (!viewId) {
    vscode.window
      .showInformationMessage(`Macro ${__runId} could not claim a Webview ID`)
      .then(resolve);
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
