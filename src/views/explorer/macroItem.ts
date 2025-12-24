import * as vscode from 'vscode';
import { SandboxExecutor } from '../../core/execution/executors/sandboxExecutor';
import { tryResolveMacroLanguage } from '../../core/language';
import { Macro } from '../../core/macro';
import { ExtensionContext } from '../../extensionContext';
import { getIcon } from '../../ui/icons';
import { formatDisplayUri } from '../../utils/ui';
import { isUntitled, parentUri } from '../../utils/uri';

export async function createMacroItem(
  macro: Macro,
  context: ExtensionContext,
): Promise<vscode.TreeItem> {
  const item = new vscode.TreeItem(macro.uri, vscode.TreeItemCollapsibleState.None);
  item.contextValue = 'macroFile';
  item.command = { arguments: [macro.uri], command: 'vscode.open', title: 'Open' };
  item.iconPath = getIcon(tryResolveMacroLanguage(macro.uri)?.language.languageId);
  item.label = macro.name;
  item.tooltip = new vscode.MarkdownString(formatDisplayUri(macro.uri));

  await updateMacroType(
    item as vscode.TreeItem & { tooltip: vscode.MarkdownString },
    macro,
    context,
  );

  const executor = context.sandboxManager.getExecutor(macro.uri);
  if (executor?.count) {
    updateRunningMacro(item as vscode.TreeItem & { tooltip: vscode.MarkdownString }, executor);
  }

  return item;
}

function updateRunningMacro(
  item: vscode.TreeItem,
  { count: executionCount }: SandboxExecutor,
): void {
  item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  item.contextValue += ' running';
  item.description = `(${executionCount})`;
}

async function updateMacroType(
  item: vscode.TreeItem & { tooltip: vscode.MarkdownString },
  macro: Macro,
  context: ExtensionContext,
): Promise<void> {
  if (isUntitled(macro.uri)) {
    item.contextValue += ' untitled';

    if (!item.description) {
      const parent = parentUri(macro.uri);
      if (parent.path !== '.') {
        item.description = formatDisplayUri(parent);
      }
    }

    item.iconPath = getIcon((await macro.getCode()).languageId);
  } else if (context.startupManager.getSource(macro.uri)) {
    item.contextValue += ' startup';
    item.tooltip.appendMarkdown('  \nStartup macro');
  }
}
