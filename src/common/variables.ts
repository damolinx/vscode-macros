import * as vscode from 'vscode';
import { resolve } from 'path';

export const HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function expandPath(filePath: string): string | undefined {
  let expandedPath: string | undefined = filePath
    .replaceAll('${userHome}', process.env.HOME || process.env.USERPROFILE || '');

  const currentWorkspace = vscode.workspace.workspaceFolders?.[0];
  if (currentWorkspace) {
    expandedPath = expandedPath.replaceAll('${workspaceFolder}', currentWorkspace.uri.fsPath);
  } else if (expandedPath.includes('${workspaceFolder}')) {
    expandedPath = undefined; // No workspace folder, cannot expand.
  }

  const normalizedPath = expandedPath && resolve(expandedPath);
  return normalizedPath;
}