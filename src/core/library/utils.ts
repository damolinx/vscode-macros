import * as vscode from 'vscode';
import * as os from 'os';
import { resolveAsUri as resolveToUri } from '../../utils/uri';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function loadConfigPaths(configKey: string): string[] {
  const configValue = vscode.workspace.getConfiguration().get<string[]>(configKey, []);
  const rawPaths = configValue.map((p) => p.trim()).filter((p) => Boolean(p));
  const expandedPaths = rawPaths.length ? expandPaths(rawPaths) : [];
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
      uniquePaths.add(trimTrailingSep(normalizeSep(path).replace(USER_HOME_TOKEN, os.homedir())));
    } else if (path.includes(WORKSPACE_TOKEN)) {
      workspaceFolders?.forEach((folder) => {
        uniquePaths.add(
          trimTrailingSep(normalizeSep(path).replace(WORKSPACE_TOKEN, folder.uri.fsPath)),
        );
      });
    } else {
      uniquePaths.add(trimTrailingSep(path));
    }
  }

  return Array.from(uniquePaths);

  // Tokenized paths can work across platform (mostly a Win/WSL concern).
  function normalizeSep(path: string): string {
    return path.replace('\\', '/');
  }
}

export function trimTrailingSep(path: string): string {
  return path.replace(/[/\\]+$/, '');
}
