import * as vscode from 'vscode';
import * as os from 'os';
import { dirname, join } from 'path';
import { Library } from '../../core/library/library';
import { MacroLibrary } from '../../core/library/macroLibrary';
import { formatDisplayUri } from '../../utils/ui';
import { parent } from '../../utils/uri';

export function createLibraryItem(library: Library) {
  const item = new vscode.TreeItem(library.uri, vscode.TreeItemCollapsibleState.Collapsed);

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
      const normalizedUri = formatDisplayUri(library.uri);
      item.description = homeRelativePath(dirname(normalizedUri));
      item.tooltip = normalizedUri;
    } else {
      item.description = parent(library.uri).toString(true);
      item.tooltip = library.uri.toString(true);
    }
    if (library instanceof MacroLibrary && library.configSource) {
      item.tooltip += `\nThis library is defined in ${library.configSource.configSources.map((s) => (s.target === vscode.ConfigurationTarget.Global ? 'User' : vscode.ConfigurationTarget[s.target])).join(', ')} settings`;
    }
  }

  function updateStartupLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'startupLibrary';
    item.iconPath = new vscode.ThemeIcon('file-symlink-directory');
    item.tooltip = new vscode.MarkdownString(
      'This library shows [configured](command:macros.startup.settings) startup macros.  \nDrag macros here to register them as such.',
    );
    item.tooltip.isTrusted = true;
  }

  function updateUntitledLibraryItem(item: vscode.TreeItem) {
    item.contextValue = 'macroLibrary,untitled';
    item.iconPath = new vscode.ThemeIcon('root-folder');
    item.tooltip = new vscode.MarkdownString(
      'This library shows `untitled` macro documents.  \nSave them using `.macro.js` or `.macro.ts` as file  \nextension to enable IntelliSense and macro tooling.',
    );
  }
}

function homeRelativePath(normalizedPath: string): string {
  const homedir = os.homedir();
  return normalizedPath.startsWith(homedir)
    ? join(process.platform === 'win32' ? '‹home›' : '~/', normalizedPath.slice(homedir.length + 1))
    : normalizedPath;
}
