import * as vscode from 'vscode';
import * as os from 'os';
import { join, posix, relative } from 'path';
import { isParent } from '../utils/uri';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export function normalizePathSeparators(path: string): string {
  const normalized = posix.normalize(path.replaceAll('\\', '/'));
  return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

export function resolveTokenizedPath(path: string): string[] {
  const paths = new Set<string>();
  if (path.includes(USER_HOME_TOKEN)) {
    paths.add(path.replace(USER_HOME_TOKEN, os.homedir()));
  } else if (path.includes(WORKSPACE_TOKEN)) {
    vscode.workspace.workspaceFolders?.forEach((folder) => {
      paths.add(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath));
    });
  } else {
    paths.add(path);
  }
  return [...paths].map(normalizePathSeparators);
}

export function tokenizeUri(uri: vscode.Uri): {
  tokenizedSource?: string;
  configurationTarget?: vscode.ConfigurationTarget;
} {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

  if (workspaceFolder) {
    return {
      tokenizedSource: normalizePathSeparators(
        join(WORKSPACE_TOKEN, relative(workspaceFolder.uri.fsPath, uri.fsPath)),
      ),
      configurationTarget: vscode.ConfigurationTarget.Workspace,
    };
  }

  const userHome = vscode.Uri.file(os.homedir());
  if (uri.scheme === 'file' && (userHome.fsPath === uri.fsPath || isParent(userHome, uri))) {
    return {
      tokenizedSource: normalizePathSeparators(
        join(USER_HOME_TOKEN, relative(os.homedir(), uri.fsPath)),
      ),
      configurationTarget: vscode.ConfigurationTarget.Global,
    };
  }

  return {};
}
