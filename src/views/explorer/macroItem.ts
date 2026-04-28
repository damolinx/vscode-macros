import * as vscode from 'vscode';
import { Macro } from '../../core/macro';
import { resolveMacroExt } from '../../core/macroLanguages';
import { ExtensionContext } from '../../extensionContext';
import { getIcon, getIconFromUri } from '../../ui/icons';
import { formatDisplayUri } from '../../utils/ui';
import { isUntitled } from '../../utils/uri';

export async function createMacroItem(
  macro: Macro,
  context: ExtensionContext,
): Promise<vscode.TreeItem> {
  const isUntitledMacro = isUntitled(macro.uri);

  const item = new vscode.TreeItem(macro.uri, vscode.TreeItemCollapsibleState.None);
  item.contextValue = 'macroFile';
  item.command = { arguments: [macro.uri], command: 'vscode.open', title: 'Open' };
  item.id = macro.id;
  item.label = macro.name;
  item.tooltip = formatDisplayUri(macro.uri);

  const executor = context.executorManager.getExecutor(macro.uri);
  const executionCount = executor?.executionCount ?? 0;
  const code = isUntitledMacro || executionCount ? await macro.getCode() : undefined;

  item.iconPath = code ? getIcon(code.languageId) : getIconFromUri(macro.uri);

  if (isUntitledMacro) {
    item.contextValue += ' untitled';
  } else if (context.startupManager.hasSource(macro.uri)) {
    item.contextValue += ' startupMacro';
  }

  if (executionCount) {
    item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    item.contextValue += ' running';
    item.description = `(${executionCount})`;
    if (code?.options.singleton) {
      item.contextValue += ' restartOnly';
    }
  } else {
    item.description = resolveMacroExt(macro.uri);
  }
  return item;
}
