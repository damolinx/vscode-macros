import * as vscode from 'vscode';
import { resolve } from 'path';

export const HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function expandTokens<T extends string | vscode.Uri>(pathOrUri: T): T {
  const expandedPathOrUri = (pathOrUri instanceof vscode.Uri)
    ? expandUri(pathOrUri) : expandPath(pathOrUri);

  return (expandedPathOrUri ?? pathOrUri) as T;
}

export function expandPath(path: string): string | undefined {
  let expandedPath = path;
  expandedPath = expandedPath.replaceAll('${userHome}', process.env.HOME || process.env.USERPROFILE || '');

  const currentWorkspace = vscode.workspace.workspaceFolders?.[0];
  if (currentWorkspace) {
    expandedPath = expandedPath.replaceAll('${workspaceFolder}', currentWorkspace.uri.fsPath);
  }

  return expandedPath.includes('${')
    ? undefined // could not expand
    : resolve(expandedPath);
}

export function expandUri(uri: vscode.Uri): vscode.Uri | undefined {
  let expandedPath = uri.path;
  if (uri.scheme === 'file') {
    expandedPath = expandedPath.replaceAll('${userHome}', process.env.HOME || process.env.USERPROFILE || '');
  }

  const currentWorkspace = vscode.workspace.workspaceFolders?.[0];
  if (currentWorkspace && currentWorkspace.uri.scheme === uri.scheme) {
    expandedPath = expandedPath.replaceAll('${workspaceFolder}', currentWorkspace.uri.fsPath);
  }

  return expandedPath.includes('${')
    ? undefined // could not expand
    : expandedPath === uri.path ? uri : uri.with({ path: expandedPath });
}