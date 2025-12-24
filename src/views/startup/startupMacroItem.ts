import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { tryResolveMacroLanguage } from '../../core/language';
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
  item.iconPath = getIcon(tryResolveMacroLanguage(uri)?.language.languageId);
  item.label = name;
  item.tooltip = new vscode.MarkdownString(formatDisplayUri(getMacroUriFromStartupMacroUri(uri)));

  if (descriptor) {
    item.contextValue = 'startupMacro running';
    item.tooltip.appendMarkdown('  \n**Status:** Running');
    item.tooltip.appendMarkdown(
      `  \n**Started:** ${formatStartTimestampLabel(descriptor.startedOn)}`,
    );
  } else {
    item.contextValue = 'startupMacro';
    item.tooltip.appendMarkdown('  \n**Status:** Not running');
  }

  return item;
}
