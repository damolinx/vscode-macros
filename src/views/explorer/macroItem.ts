import * as vscode from 'vscode';
import { SandboxExecutor } from '../../core/execution/executors/sandboxExecutor';
import { Macro } from '../../core/macro';
import { resolveMacroLanguageFromUri } from '../../core/macroLanguages';
import { ExtensionContext } from '../../extensionContext';
import { getIcon } from '../../ui/icons';
import {
  formatDisplayUri,
  formatHomeRelativePath,
  formatWorkspaceRelativePath,
} from '../../utils/ui';
import { isUntitled, parentUri } from '../../utils/uri';

export async function createMacroItem(
  macro: Macro,
  context: ExtensionContext,
): Promise<vscode.TreeItem> {
  const item = new vscode.TreeItem(macro.uri, vscode.TreeItemCollapsibleState.None);
  item.contextValue = 'macroFile';
  item.command = { arguments: [macro.uri], command: 'vscode.open', title: 'Open' };
  item.iconPath = getIcon(resolveMacroLanguageFromUri(macro.uri)?.id);
  item.label = macro.name;
  item.tooltip = formatDisplayUri(macro.uri);

  await updateMacroType(item as vscode.TreeItem & { tooltip: string }, macro, context);

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
  item: vscode.TreeItem & { tooltip: string },
  macro: Macro,
  context: ExtensionContext,
): Promise<void> {
  if (isUntitled(macro.uri)) {
    item.contextValue += ' untitled';

    if (!item.description) {
      const parent = parentUri(macro.uri);
      if (parent.path !== '.') {
        item.description =
          formatWorkspaceRelativePath(macro.uri) ?? formatHomeRelativePath(macro.uri);
      }
    }

    item.iconPath = getIcon((await macro.getCode()).languageId);
  } else if (context.startupManager.getSource(macro.uri)) {
    item.contextValue += ' startupMacro';
    item.tooltip += '\nStartup macro';
  }
}
