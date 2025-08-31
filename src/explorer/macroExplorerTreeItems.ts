import * as vscode from 'vscode';
import * as os from 'os';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { isUntitled, parent } from '../utils/uri';

export function getLibraryItem({ uri }: MacroLibrary) {
  const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.Collapsed);
  item.contextValue = 'macroLibrary';
  if (!isUntitled(uri)) {
    item.description = homeRelativePath(uri) || vscode.workspace.asRelativePath(parent(uri));
  } else {
    // item.label = 'Temporary';
    item.contextValue += ',untitled';
    item.tooltip =
      'Unsaved macros. Save as .macro.js to enable autocomplete,\nIntelliSense, and macro tooling.';
    item.iconPath = new vscode.ThemeIcon('server-process');
  }
  return item;

  function homeRelativePath({ scheme, fsPath }: vscode.Uri): string | undefined {
    if (scheme !== 'file') {
      return;
    }

    let homedir = os.homedir();
    let homePrefix: string;
    if (process.platform === 'win32') {
      homedir = homedir[0].toLowerCase() + homedir.slice(1);
      homePrefix = 'home › ';
    } else {
      homePrefix = '~/';
    }

    return fsPath.startsWith(homedir)
      ? `${homePrefix}${fsPath.slice(homedir.length + 1)}`
      : undefined;
  }
}

export function getMacroItem({ uri }: Macro, { runInstanceCount: runCount }: MacroRunner) {
  const item = new vscode.TreeItem(
    uri,
    runCount ? vscode.TreeItemCollapsibleState.Collapsed : undefined,
  );
  item.contextValue = 'macroFile';
  item.command = {
    arguments: [uri],
    command: 'vscode.open',
    title: 'Open Macro',
  };
  item.iconPath = new vscode.ThemeIcon('symbol-function');
  if (runCount) {
    item.contextValue += ',running';
    item.description = runCount === 1 ? '1 instance' : `${runCount} instances`;
    item.tooltip = `${uri.scheme === 'file' ? uri.fsPath : uri.toString(true)} · ${runCount === 1 ? '1 instance' : `${runCount} instances`}`;
  }
  return item;
}

export function getRunItem(runInfo: MacroRunInfo) {
  const item = new vscode.TreeItem(runInfo.id);
  item.contextValue = 'macroRun';
  item.tooltip = getTooltip();

  if (runInfo.startup) {
    item.description = 'startup';
    item.iconPath = new vscode.ThemeIcon('circle-filled');
  } else {
    item.iconPath = new vscode.ThemeIcon('circle-outline');
  }
  return item;

  function getTooltip(): string | vscode.MarkdownString | undefined {
    const options = Object.entries(runInfo.snapshot.options)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    return `${runInfo.startup ? 'Startup run instance' : 'Run instance'}${options.length ? ` · ${options.join(' · ')}` : ''}`;
  }
}
