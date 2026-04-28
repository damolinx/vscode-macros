import * as vscode from 'vscode';
import { Execution } from '../../core/execution/execution';
import { StartupMacro } from '../../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../../core/startupMacroId';
import { getIconFromUri } from '../../ui/icons';
import {
  formatDisplayUri,
  formatHomeRelativePath,
  formatStartTimestampLabel,
  formatWorkspaceRelativePath,
} from '../../utils/ui';

export function createStartupItem(
  { macroUri, name, uri }: StartupMacro,
  execution?: Execution,
): vscode.TreeItem {
  const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.None);
  item.command = {
    arguments: [getMacroUriFromStartupMacroUri(uri)],
    command: 'vscode.open',
    title: 'Open',
  };
  item.description = formatWorkspaceRelativePath(macroUri) ?? formatHomeRelativePath(macroUri);
  item.iconPath = getIconFromUri(uri);
  item.label = name;
  item.tooltip = formatDisplayUri(getMacroUriFromStartupMacroUri(uri));

  if (execution) {
    item.contextValue = 'startupMacro running';
    item.tooltip += `\nStarted: ${formatStartTimestampLabel(execution.startedOn)} • Version: ${execution.snapshot.version}`;
  } else {
    item.contextValue = 'startupMacro';
    item.tooltip += '\nNot running';
  }

  return item;
}
