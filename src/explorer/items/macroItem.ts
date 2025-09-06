import * as vscode from 'vscode';
import { MacroRunner } from '../../core/execution/macroRunner';
import { Macro } from '../../core/macro';
import { createIcon } from '../../ui/icons';
import { isUntitled } from '../../utils/uri';

export const JsIcon = createIcon('symbol-function', 'macros.js');
export const MacroJsIcon = createIcon('symbol-function', 'macros.macrojs');

export const TsIcon = createIcon('symbol-function', 'macros.ts');
export const MacroTsIcon = createIcon('symbol-function', 'macros.macrots');

export function createMacroItem({ uri }: Macro, { runInstanceCount: runCount }: MacroRunner) {
  const item = new vscode.TreeItem(uri);

  item.contextValue = 'macroFile';
  if (isUntitled(uri)) {
    item.contextValue += ',untitled';
  }

  item.command = {
    arguments: [uri],
    command: 'vscode.open',
    title: 'Open Macro',
  };

  item.iconPath = getIcon(uri);

  if (runCount) {
    item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    item.contextValue += ',running';
    item.description = `⟨${runCount}⟩`;

    const displayPath = uri.scheme === 'file' ? uri.fsPath : uri.toString(true);
    const runInstance = runCount === 1 ? '1 running instance' : `${runCount} running instances`;
    item.tooltip = `${displayPath}\n${runInstance}`;
  }

  return item;
}

function getIcon({ path }: vscode.Uri): vscode.ThemeIcon | undefined {
  if (path.endsWith('.js')) {
    return isMacro('.js') ? MacroJsIcon : JsIcon;
  } else if (path.endsWith('.ts')) {
    return isMacro('.ts') ? MacroTsIcon : TsIcon;
  }
  return;

  function isMacro(ext: string) {
    return path.endsWith('.macro', path.length - ext.length);
  }
}
