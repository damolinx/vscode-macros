import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { resolveMacroLanguageFromUri } from '../../core/macroLanguages';
import { StartupMacro } from '../../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../../core/startupMacroId';
import { getIcon } from '../../ui/icons';
import {
  formatDisplayUri,
  formatHomeRelativePath,
  formatStartTimestampLabel,
  formatWorkspaceRelativePath,
} from '../../utils/ui';

export function createStartupItem(
  { macroUri, name, uri }: StartupMacro,
  descriptor?: SandboxExecutionDescriptor,
) {
  const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.None);
  item.command = {
    arguments: [getMacroUriFromStartupMacroUri(uri)],
    command: 'vscode.open',
    title: 'Open',
  };
  item.description = formatWorkspaceRelativePath(macroUri) ?? formatHomeRelativePath(macroUri);
  item.iconPath = getIcon(resolveMacroLanguageFromUri(uri)?.id);
  item.label = name;
  item.tooltip = formatDisplayUri(getMacroUriFromStartupMacroUri(uri));

  if (descriptor) {
    item.contextValue = 'startupMacro running';
    item.tooltip += `\nStarted: ${formatStartTimestampLabel(descriptor.startedOn)} • Version: ${descriptor.snapshot.version}`;
  } else {
    item.contextValue = 'startupMacro';
    item.tooltip += '\nNot running';
  }

  return item;
}
