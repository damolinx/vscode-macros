import * as vscode from 'vscode';

export class SourceTarget {
  public static readonly Global = new SourceTarget(vscode.ConfigurationTarget.Global);
  public static readonly Workspace = new SourceTarget(vscode.ConfigurationTarget.Workspace);

  public static WorkspaceFolder(folder: vscode.WorkspaceFolder): SourceTarget {
    return new SourceTarget(vscode.ConfigurationTarget.WorkspaceFolder, folder);
  }

  private constructor(
    target: vscode.ConfigurationTarget.Global | vscode.ConfigurationTarget.Workspace,
  );
  private constructor(
    target: vscode.ConfigurationTarget.WorkspaceFolder,
    folder: vscode.WorkspaceFolder,
  );
  private constructor(
    public readonly target: vscode.ConfigurationTarget,
    public readonly folder?: vscode.WorkspaceFolder,
  ) {
    this.folder = folder;
    this.target = target;
  }
}
