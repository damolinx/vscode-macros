import * as vscode from 'vscode';
import { Library } from '../../core/library/library';
import { MacroLibrary } from '../../core/library/macroLibrary';
import {
  formatDisplayUri,
  formatHomeRelativePath,
  formatWorkspaceRelativePath,
} from '../../utils/ui';
import { parentUri } from '../../utils/uri';

const LibraryIcon = new vscode.ThemeIcon('file-directory');

const StartupLibraryIcon = new vscode.ThemeIcon('file-symlink-directory');
const StartupLibraryTooltip = new vscode.MarkdownString(
  'Lists macros [configured](command:macros.startup.settings) to run on startup.',
);
StartupLibraryTooltip.isTrusted = true;

const UntitledLibraryIcon = new vscode.ThemeIcon('root-folder');
const UntitledLibraryTooltip = new vscode.MarkdownString(
  'Lists `untitled` macro documents. These exist only in memory  \nuntil saved, which limits IntelliSense and other tooling support.',
);

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
      updateLibraryItem(item, library);
      break;
  }

  return item;
}

function updateLibraryItem(item: vscode.TreeItem, library: Library) {
  item.contextValue = 'macroLibrary';
  item.description =
    formatWorkspaceRelativePath(library.uri) ?? formatHomeRelativePath(parentUri(library.uri));
  item.iconPath = LibraryIcon;
  item.tooltip = new vscode.MarkdownString(formatDisplayUri(library.uri));

  if (library instanceof MacroLibrary && library.configSource) {
    const settings = library.configSource.configSources.map((s) => {
      switch (s.target) {
        case vscode.ConfigurationTarget.Global:
          return '[User](command:workbench.action.openSettings?%5B%22macros.sourceDirectories%22%5D)';
        case vscode.ConfigurationTarget.Workspace:
          return '[Workspace](command:workbench.action.openWorkspaceSettings?%5B%22macros.sourceDirectories%22%5D)';
        case vscode.ConfigurationTarget.WorkspaceFolder:
          return '[Folder](command:workbench.action.openFolderSettings?%5B%22macros.sourceDirectories%22%5D)';
      }
    });
    item.tooltip.appendMarkdown(`  \nThis library is defined in ${settings.join(', ')} settings.`);
    item.tooltip.isTrusted = true;
  }
}

function updateStartupLibraryItem(item: vscode.TreeItem) {
  item.contextValue = 'startupLibrary';
  item.description = 'Startup macros';
  item.iconPath = StartupLibraryIcon;
  item.tooltip = StartupLibraryTooltip;
}

function updateUntitledLibraryItem(item: vscode.TreeItem) {
  item.contextValue = 'macroLibrary untitled';
  item.description = 'Untitled macros';
  item.iconPath = UntitledLibraryIcon;
  item.tooltip = UntitledLibraryTooltip;
}
