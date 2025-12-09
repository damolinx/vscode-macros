import * as vscode from 'vscode';
import * as os from 'os';
import { dirname, join } from 'path';
import { Library } from '../../core/library/library';
import { MacroLibrary } from '../../core/library/macroLibrary';
import { parent, uriBasename } from '../../utils/uri';

export function createLibraryItem(library: Library) {
  const item = new vscode.TreeItem(
    uriBasename(library.uri),
    vscode.TreeItemCollapsibleState.Collapsed,
  );

  switch (library.uri.scheme) {
    case 'startup':
      updateStartupLibraryItem(item);
      break;
    case 'untitled':
      updateUntitledLibraryItem(item);
      break;
    default:
      updateStdLibraryItem(item);
      break;
  }

  return item;

  function updateStdLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'macroLibrary';
    if (library.uri.scheme === 'file') {
      const normalizedUri = normalizePath(library.uri.fsPath);
      item.description = homeRelativePath(dirname(normalizedUri));
      item.tooltip = normalizedUri;
    } else {
      item.description = parent(library.uri).toString(true);
      item.tooltip = library.uri.toString(true);
    }
    if (library instanceof MacroLibrary && library.configSource) {
      item.tooltip += `\nThis library is defined in ${library.configSource.sources.map((s) => (s.target === vscode.ConfigurationTarget.Global ? 'User' : vscode.ConfigurationTarget[s.target])).join(', ')} settings`;
    }
  }

  function updateStartupLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'startupLibrary';
    item.iconPath = new vscode.ThemeIcon('file-symlink-directory');
    item.tooltip = new vscode.MarkdownString('This library holds startup macros.  \nDrag macros here to register them as such.');
  }

  function updateUntitledLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'macroLibrary,untitled';
    item.iconPath = new vscode.ThemeIcon('root-folder');
    item.tooltip = new vscode.MarkdownString(
      'This library holds all `untitled` macro editors.  \n Save them using `.macro.js` or `.macro.ts` as file  \nextension to enable IntelliSense and macro tooling.',
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
