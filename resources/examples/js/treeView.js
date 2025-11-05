// @macro: retained, singleton
//   retained  – keeps the TreeDataProvider alive until stopped
//   singleton – ensures no more than one instance runs at a time
//
// References:
//   - Tree View API: https://code.visualstudio.com/api/extension-guides/tree-view

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

/**
 * @param {string} viewId - The ID of the view to create. 
 * @returns {import('vscode').TreeView<string>}
 */
function createTreeView(viewId) {
  const treeView = vscode.window.createTreeView(
    viewId, {
    treeDataProvider: createTreeProvider()
  });
  treeView.title = `Macro ${__runId}`;
  return treeView;
}

/** @returns {Promise<void>} */
async function main() {
  const viewId = macros.window.getTreeViewId();
  if (!viewId) {
    await vscode.window.showInformationMessage(
      `Macro ${__runId} could not claim a TreeView ID`,
    );
    return;
  }

  __disposables.push(
    createTreeView(viewId), {
    dispose: () => {
      macros.window.releaseTreeViewId(viewId);
      vscode.commands.executeCommand('setContext', `${viewId}.show`, false);
    }
  });
  vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
  vscode.commands.executeCommand(`${viewId}.focus`);
}

main()