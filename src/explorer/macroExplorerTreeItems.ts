import * as vscode from 'vscode';
import * as os from 'os';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { MacroOptions } from '../core/macroOptions';
import { isUntitled, parent } from '../utils/uri';

export function getLibraryItem({ uri }: MacroLibrary) {
  const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.Collapsed);
  item.contextValue = 'macroLibrary';
  if (!isUntitled(uri)) {
    item.description = homeRelativePath(uri) || vscode.workspace.asRelativePath(parent(uri));
  } else {
    item.contextValue += ',untitled';
    item.tooltip = new vscode.MarkdownString(
      '**Unsaved macros** — Save files as `.macro.js` or `.macro.ts`  \nto enable IntelliSense and macro tooling.',
    );
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

const JsIcon = new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('macros.js'));
const TsIcon = new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('macros.ts'));
const MacroJsIcon = new vscode.ThemeIcon(
  'symbol-function',
  new vscode.ThemeColor('macros.macrojs'),
);
const MacroTsIcon = new vscode.ThemeIcon(
  'symbol-function',
  new vscode.ThemeColor('macros.macrots'),
);

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
  item.iconPath = getIconPath();
  if (runCount) {
    item.contextValue += ',running';
    item.description = `(${runCount})`;
    item.tooltip = `${uri.scheme === 'file' ? uri.fsPath : uri.toString(true)}\n${runCount === 1 ? '1 running instance' : `${runCount} running instances`}`;
  }
  return item;

  function getIconPath(): vscode.ThemeIcon | undefined {
    if (uri.path.endsWith('.js')) {
      return uri.path.endsWith('.macro.js') ? MacroJsIcon : JsIcon;
    } else if (uri.path.endsWith('.ts')) {
      return uri.path.endsWith('.macro.ts') ? MacroTsIcon : TsIcon;
    }
    return;
  }
}

const RunningIcon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('macros.general'));
const StartupRunningIcon = new vscode.ThemeIcon(
  'record-small',
  new vscode.ThemeColor('macros.general'),
);

export function getRunItem(runInfo: MacroRunInfo) {
  const item = new vscode.TreeItem(runInfo.id);
  item.contextValue = 'macroRun';
  item.tooltip = getTooltip(runInfo);

  if (runInfo.startup) {
    item.description = '(startup)';
    item.iconPath = StartupRunningIcon;
  } else {
    item.iconPath = RunningIcon;
  }
  return item;

  function getTooltip({ snapshot }: MacroRunInfo): string | vscode.MarkdownString | undefined {
    const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
      (k) => snapshot.options[k],
    );
    return (
      `Options: ${options.length ? `${options.join(' · ')}` : ''}` +
      `\nVersion: ${snapshot.version}` +
      `\n${startedTooltip(snapshot.startedOn)}`
    );
  }

  function startedTooltip(ts: number): string {
    const now = new Date();
    const date = new Date(ts);

    const isSameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    const time = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 2,
    });

    return isSameDay
      ? `Started at ${time}`
      : `Started on ${date.toLocaleDateString([], {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric',
        })}, ${time}`;
  }
}
