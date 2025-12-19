import * as vscode from 'vscode';
import { tryResolveMacroLanguage } from '../../core/language';
import { StartupMacroLibrarySourceManager } from '../../core/library/startupMacroLibrarySourceManager';
import { Macro } from '../../core/macro';
import { createIcon } from '../../ui/icons';
import { formatDisplayUri } from '../../utils/ui';
import { isUntitled, parent, uriBasename } from '../../utils/uri';

export const JsIcon = createIcon('symbol-function', 'macros.js');
export const TsIcon = createIcon('symbol-function', 'macros.ts');
export const UnknownIcon = createIcon('symbol-function', 'macros.general');

export async function createMacroItem(macro: Macro, runCount: number): Promise<vscode.TreeItem> {
  const { uri } = macro;
  const item = new vscode.TreeItem(macro.uri, vscode.TreeItemCollapsibleState.None);
  item.contextValue = 'macroFile';
  item.label = macro.name;

  item.command = {
    arguments: [uri],
    command: 'vscode.open',
    title: 'Open Macro',
  };

  if (isUntitled(uri)) {
    item.contextValue += ',untitled';
    const p = parent(uri);
    item.tooltip =
      p.path === '.'
        ? macro.name
        : new vscode.MarkdownString(
            `${macro.name}  \nThis macro will be saved to the *${uriBasename(p)}* library`,
          );
  } else if (StartupMacroLibrarySourceManager.instance.inLibrary(uri)) {
    item.contextValue += ',startup';
  }

  if (runCount) {
    item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    item.contextValue += ',running';
    item.description = `(${runCount})`;
    const displayPath = formatDisplayUri(uri);
    const runInstance = runCount === 1 ? '1 running instance' : `${runCount} running instances`;
    item.tooltip = `${displayPath}\n${runInstance}`;
  } else {
    item.iconPath = await getIcon(macro);
  }

  return item;
}

async function getIcon(macro: Macro): Promise<vscode.ThemeIcon | undefined> {
  const id = tryResolveMacroLanguage(macro.uri)?.language.id ?? (await macro.getCode()).languageId;
  switch (id) {
    case 'javascript':
      return JsIcon;
    case 'typescript':
      return TsIcon;
    default:
      return UnknownIcon;
  }
}
