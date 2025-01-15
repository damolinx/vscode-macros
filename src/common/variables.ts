import * as vscode from 'vscode';

export const HOME_TOKEN = "${userHome}";
export const WORKSPACE_TOKEN = "${workspaceFolder}";

export function expandPath(filePath: string): string {
  return filePath
    .replaceAll('${userHome}', process.env.HOME || process.env.USERPROFILE || '')
    .replaceAll('${workspaceFolder}', vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
}