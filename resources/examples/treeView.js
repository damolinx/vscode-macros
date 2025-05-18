
// @macro:singleton

// Learn about the Tree View API at https://code.visualstudio.com/api/extension-guides/tree-view

// Available: "macrosView.treeview1", "macrosView.treeview2", "macrosView.treeview3"
const viewId = "macrosView.treeview1";

/** @returns {import('vscode').TreeDataProvider<string>} */
function createTreeProvider() {
  return {
    getTreeItem: (element) => {
      switch (element) {
        case "root":
          return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.Collapsed);
        default:
          return new vscode.TreeItem(element);
      }
    },
    getChildren: (element) => {
      switch (element) {
        case undefined:
          return ["root"];
        case "root":
          return ["foo", "bar", "baz"];
        default:
          return undefined;
      }
    }
  };
}

function createTreeView() {
  const treeView = vscode.window.createTreeView(
    viewId,
    {
      treeDataProvider: createTreeProvider()
    });
  treeView.title = `Macro ${__runId}`;
  return treeView;
}

// Keep macro alive until view is disposed.
new Promise((resolve) => {
  const treeView = createTreeView();
  __cancellationToken.onCancellationRequested(resolve);
  __disposables.push(
    treeView,
    {
      dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false)
    });

  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
});