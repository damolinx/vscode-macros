import * as vscode from 'vscode';
import * as os from 'os';
import { dirname, join } from 'path';
import { MacroLibrary } from '../../core/library/macroLibrary';
import { isUntitled, parent, uriBasename } from '../../utils/uri';

export function createLibraryItem({ uri, configSource }: MacroLibrary) {
  const item = new vscode.TreeItem(uriBasename(uri), vscode.TreeItemCollapsibleState.Collapsed);
  if (isUntitled(uri)) {
    updateUntitledLibraryItem(item);
  } else {
    updateStdLibraryItem(item);
  }

  return item;

  function updateStdLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'macroLibrary';
    if (uri.scheme === 'file') {
      const normalizedUri = normalizePath(uri.fsPath);
      item.description = homeRelativePath(dirname(normalizedUri));
      item.tooltip = normalizedUri;
    } else {
      item.description = parent(uri).toString(true);
      item.tooltip = uri.toString(true);
    }
    if (configSource) {
      item.tooltip += `\nSource Settings: ${configSource.sources.map((s) => (s.target === vscode.ConfigurationTarget.Global ? 'User' : vscode.ConfigurationTarget[s.target])).join(', ')}`;
    }
  }

  function updateUntitledLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'macroLibrary,untitled';
    item.iconPath = new vscode.ThemeIcon('server-process');
    item.tooltip = new vscode.MarkdownString(
      "This library includes any untitled macro editors until you save them.  \nUse `.macro.js` or `.macro.ts` extension to enable IntelliSense and macro tooling."
    );
  }
}

function homeRelativePath(normalizedPath: string): string {
  const homedir = os.homedir();
  return normalizedPath.startsWith(homedir)
    ? join(process.platform === 'win32' ? '‹home›' : '~/', normalizedPath.slice(homedir.length + 1))
    : normalizedPath;
}

function normalizePath(fsPath: string) {
  if (process.platform === 'win32' && fsPath.length > 1) {
    return fsPath[0].toUpperCase() + fsPath.slice(1);
  }
  return fsPath;
}
