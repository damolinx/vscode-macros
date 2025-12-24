import * as vscode from 'vscode';
import { createSourceTargetItem } from './sourceTargetItem';

export class SourceTarget {
  public static readonly Global = new SourceTarget(vscode.ConfigurationTarget.Global);
  public static readonly Workspace = new SourceTarget(vscode.ConfigurationTarget.Workspace);

  public static WorkspaceFolder(folder: vscode.WorkspaceFolder): SourceTarget {
    return new SourceTarget(vscode.ConfigurationTarget.WorkspaceFolder, folder);
  }

  private _treeItem?: vscode.TreeItem;
  public readonly folder?: vscode.WorkspaceFolder;
  public readonly target: vscode.ConfigurationTarget;

  private constructor(
    target: vscode.ConfigurationTarget.Global | vscode.ConfigurationTarget.Workspace,
  );
  private constructor(
    target: vscode.ConfigurationTarget.WorkspaceFolder,
    folder: vscode.WorkspaceFolder,
  );
  private constructor(target: vscode.ConfigurationTarget, folder?: vscode.WorkspaceFolder) {
    this.folder = folder;
    this.target = target;
  }

  public get treeItem(): vscode.TreeItem {
    this._treeItem ??= createSourceTargetItem(this);
    return this._treeItem;
  }
}
