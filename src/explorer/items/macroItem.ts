import * as vscode from 'vscode';
import { MacroRunner } from '../../core/execution/macroRunner';
import { tryResolveMacroLanguage } from '../../core/language';
import { StartupMacroLibrarySourceManager } from '../../core/library/startupMacroLibrarySourceManager';
import { Macro } from '../../core/macro';
import { createIcon } from '../../ui/icons';
import { isUntitled, parent, uriBasename } from '../../utils/uri';

export const JsIcon = createIcon('symbol-function', 'macros.js');
export const TsIcon = createIcon('symbol-function', 'macros.ts');

export function createMacroItem({ name, uri }: Macro, { runInstanceCount: runCount }: MacroRunner) {
  const item = new vscode.TreeItem(uri);
  item.label = name;

  item.contextValue = 'macroFile';
  if (isUntitled(uri)) {
    item.contextValue += ',untitled';
    const p = parent(uri);
    item.tooltip = new vscode.MarkdownString(
      `${uriBasename(uri)}${p.path !== '.' ? `  \nThis macro will be saved to the *${uriBasename(p)}* library` : ''}`,
    );
  }

  item.command = {
    arguments: [uri],
    command: 'vscode.open',
    title: 'Open Macro',
  };

  if (StartupMacroLibrarySourceManager.instance.hasLibrary(uri)) {
    item.contextValue += ',startup';
  }

  if (runCount) {
    item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    item.contextValue += ',running';
    item.description = `⟨${runCount}⟩`;

    const displayPath = uri.scheme === 'file' ? uri.fsPath : uri.toString(true);
    const runInstance = runCount === 1 ? '1 running instance' : `${runCount} running instances`;
    item.tooltip = `${displayPath}\n${runInstance}`;
  } else {
    item.iconPath = getIcon(uri);
  }

  return item;
}

function getIcon(uri: vscode.Uri): vscode.ThemeIcon | undefined {
  const { language } = tryResolveMacroLanguage(uri) ?? {};
  switch (language?.id) {
    case 'javascript':
      return JsIcon;
    case 'typescript':
      return TsIcon;
    default:
      return undefined;
  }
}
