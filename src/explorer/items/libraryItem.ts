import * as vscode from 'vscode';
import { Library } from '../../core/library/library';
import { MacroLibrary } from '../../core/library/macroLibrary';
import {
  formatDisplayUri,
  formatHomeRelativePath,
  formatWorkspaceRelativePath,
} from '../../utils/ui';
import { parentUri } from '../../utils/uri';

const LibraryIcon = new vscode.ThemeIcon('folder-library');
const StartupLibraryIcon = new vscode.ThemeIcon('file-symlink-directory');
const UntitledLibraryIcon = new vscode.ThemeIcon('root-folder');

const StartupLibraryTooltip = new vscode.MarkdownString(
  'Lists macros [configured](command:macros.startup.settings) to run on startup.',
);
StartupLibraryTooltip.isTrusted = true;

const UntitledLibraryTooltip = new vscode.MarkdownString(
  'Lists `untitled` macro documents. These exist only in memory until saved.',
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
  item.tooltip = formatDisplayUri(library.uri);

  if (library instanceof MacroLibrary && library.configSource) {
    item.tooltip += `\nThis library is defined in ${library.configSource.configSources.map((s) => (s.target === vscode.ConfigurationTarget.Global ? 'User' : vscode.ConfigurationTarget[s.target])).join(', ')} settings.`;
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
