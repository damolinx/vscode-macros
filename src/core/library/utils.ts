import * as vscode from 'vscode';
import * as os from 'os';
import { resolveAsUri as resolveToUri } from '../../utils/uri';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function loadConfigPaths(configKey: string): string[] {
  const configValue = vscode.workspace.getConfiguration().get<string[]>(configKey, []);
  const unexpandedPaths = configValue.map((p) => p.trim()).filter((p) => Boolean(p));
  const expandedPaths = unexpandedPaths.length ? expandPaths(unexpandedPaths) : [];
  return expandedPaths;
}

export function loadConfigUris(configKey: string): vscode.Uri[] {
  return loadConfigPaths(configKey).map(resolveToUri);
}

export function expandPaths(paths: string[]): string[] {
  const uniquePaths = new Set<string>();
  const { workspaceFolders } = vscode.workspace;

  for (const path of paths) {
    if (path.includes(USER_HOME_TOKEN)) {
      uniquePaths.add(trimTrailingSep(path.replace(USER_HOME_TOKEN, os.homedir())));
    } else if (path.includes(WORKSPACE_TOKEN)) {
      workspaceFolders?.forEach((folder) => {
        uniquePaths.add(trimTrailingSep(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath)));
      });
    } else {
      uniquePaths.add(trimTrailingSep(path));
    }
  }

  return Array.from(uniquePaths);
}

export function trimTrailingSep(path: string): string {
  return path.replace(/[/\\]+$/, '');
}
