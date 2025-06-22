import * as vscode from 'vscode';
import * as os from 'os';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function expandConfigPaths(configKey: string): string[] {
  const rawPaths = vscode.workspace.getConfiguration()
    .get<string[]>(configKey, []);
  if (rawPaths.length === 0) {
    return [];
  }

  return expandPaths(rawPaths);
}

export function expandPaths(paths: string[]) {
  const uniquePaths = new Set<string>();
  const { workspaceFolders } = vscode.workspace;

  for (const path of paths) {
    const expandedPaths = [];
    if (path.includes(USER_HOME_TOKEN)) {
      expandedPaths.push(path.replace(USER_HOME_TOKEN, os.homedir()));
    } else if (path.includes(WORKSPACE_TOKEN)) {
      workspaceFolders?.forEach((folder) => {
        expandedPaths.push(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath));
      });
    } else {
      expandedPaths.push(path);
    }
    expandedPaths.forEach((p) => uniquePaths.add(p.replace(/[/\\]+$/, '')));
  }
  return Array.from(uniquePaths);
}