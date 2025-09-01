// @ts-nocheck
// @macro: retained, singleton
//   retained  – keeps the TreeDataProvider alive until stopped
//   singleton – ensures no more than one instance runs at a time

import * as vscode from "vscode";

// References:
//   - Tree View API: https://code.visualstudio.com/api/extension-guides/tree-view
//
// Available view IDs:
//   - macrosView.treeview1
//   - macrosView.treeview2
//   - macrosView.treeview3
const viewId = "macrosView.treeview1";

function createTreeProvider() {
  return {
    getTreeItem: (element: string) => {
      switch (element) {
        case "root":
          return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.Collapsed);
        default:
          return new vscode.TreeItem(element);
      }
    },
    getChildren: (element: string) => {
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
    viewId, {
    treeDataProvider: createTreeProvider()
  });
  treeView.title = `Macro ${__runId}`;
  return treeView;
}

__disposables.push(
  createTreeView(), {
  dispose: () => vscode.commands.executeCommand('setContext', `${viewId}.show`, false)
});

vscode.commands.executeCommand('setContext', `${viewId}.show`, true);
vscode.commands.executeCommand(`${viewId}.focus`);