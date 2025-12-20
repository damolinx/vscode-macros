import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { tryResolveMacroLanguage } from '../../core/language';
import { StartupMacro } from '../../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../../core/startupMacroId';
import { IconColor, JsIconColor, TsIconColor } from '../../ui/icons';
import { formatDisplayUri, formatStartTimestampLabel } from '../../utils/ui';

const Icon = new vscode.ThemeIcon('symbol-event', IconColor);
const JsIcon = new vscode.ThemeIcon('symbol-event', JsIconColor);
const TsIcon = new vscode.ThemeIcon('symbol-event', TsIconColor);

export function createStartupItem(
  { name, uri }: StartupMacro,
  descriptor?: SandboxExecutionDescriptor,
) {
  const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.None);
  item.command = {
    arguments: [getMacroUriFromStartupMacroUri(uri)],
    command: 'vscode.open',
    title: 'Open',
  };
  item.iconPath = getIcon(uri);
  item.label = name;
  item.tooltip = new vscode.MarkdownString(formatDisplayUri(getMacroUriFromStartupMacroUri(uri)));

  if (descriptor) {
    item.contextValue = 'startupMacro running';
    item.description = '(active)';
    item.tooltip.appendMarkdown(
      `  \n**Started:** ${formatStartTimestampLabel(descriptor.startedOn)}`,
    );
  } else {
    item.contextValue = 'startupMacro';
    item.description = '(inactive)';
    item.tooltip.appendMarkdown('  \n**Status:** Not running');
  }

  return item;
}

function getIcon(uri: vscode.Uri): vscode.ThemeIcon {
  switch (tryResolveMacroLanguage(uri)?.language.languageId) {
    case 'javascript':
      return JsIcon;
    case 'typescript':
      return TsIcon;
    default:
      return Icon;
  }
}
