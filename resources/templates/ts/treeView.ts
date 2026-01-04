// @ts-nocheck
// @macro: retained, singleton
//   retained  – keeps the macro context alive until explicitly stopped
//   singleton – ensures only one macro instance runs at a time

// Reference: https://code.visualstudio.com/api/extension-guides/tree-view

function createTreeProvider(): vscode.TreeDataProvider<string> {
  return {
    getTreeItem: (element: string) => {
      switch (element) {
        case 'root':
          return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.Collapsed);
        default:
          return new vscode.TreeItem(element);
      }
    },
    getChildren: (element: string) => {
      switch (element) {
        case undefined:
          return ['root'];
        case 'root':
          return ['foo', 'bar', 'baz'];
        default:
          return undefined;
      }
    }
  };
}

function createTreeView(viewId: string): vscode.TreeView<string> {
  const treeView = vscode.window.createTreeView(
    viewId, {
    treeDataProvider: createTreeProvider()
  });
  treeView.title = `Macro ${__runId}`;
  return treeView;
}

async function main(): Promise<void> {
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