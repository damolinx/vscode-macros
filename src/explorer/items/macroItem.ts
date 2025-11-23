import * as vscode from 'vscode';
import { extname } from 'path';
import { MacroRunner } from '../../core/execution/macroRunner';
import { MACRO_LANGUAGES } from '../../core/language';
import { StartupMacroLibrarySourceManager } from '../../core/library/startupMacroLibrarySourceManager';
import { Macro } from '../../core/macro';
import { createIcon } from '../../ui/icons';
import { isUntitled } from '../../utils/uri';

export const JsIcon = createIcon('symbol-function', 'macros.js');
export const MacroJsIcon = createIcon('symbol-function', 'macros.macrojs');

export const TsIcon = createIcon('symbol-function', 'macros.ts');
export const MacroTsIcon = createIcon('symbol-function', 'macros.macrots');

export function createMacroItem({ name, uri }: Macro, { runInstanceCount: runCount }: MacroRunner) {
  const item = new vscode.TreeItem(uri);
  item.label = name;

  item.contextValue = 'macroFile';
  if (isUntitled(uri)) {
    item.contextValue += ',untitled';
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

function getIcon({ path }: vscode.Uri): vscode.ThemeIcon | undefined {
  const extension = extname(path);
  if (MACRO_LANGUAGES.javascript.extensions.includes(extension)) {
    return isMacro('.js') ? MacroJsIcon : JsIcon;
  } else if (MACRO_LANGUAGES.typescript.extensions.includes('.ts')) {
    return isMacro('.ts') ? MacroTsIcon : TsIcon;
  }
  return;

  function isMacro(ext: string) {
    return path.endsWith('.macro', path.length - ext.length);
  }
}
