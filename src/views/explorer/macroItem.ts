import * as vscode from 'vscode';
import { Macro } from '../../core/macro';
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
  item.description = context.libraryManager.libraryFor(
    isUntitledMacro ? macro.uri.with({ scheme: 'file' }) : macro.uri,
  )?.name;
  item.label = macro.name;
  item.tooltip = formatDisplayUri(macro.uri);

  const executor = context.sandboxManager.getExecutor(macro.uri);
  const code = isUntitledMacro || executor?.isRunning() ? await macro.getCode() : undefined;

  item.iconPath = code ? getIcon(code.languageId) : getIconFromUri(macro.uri);

  if (isUntitledMacro) {
    item.contextValue += ' untitled';
  } else if (context.startupManager.hasSource(macro.uri)) {
    item.contextValue += ' startupMacro';
  }

  if (executor?.isRunning()) {
    item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    item.contextValue += ' running';
    item.description = `(${executor.count})`;
    if (code?.options.singleton) {
      item.contextValue += ' restartOnly';
    }
  }
  return item;
}
