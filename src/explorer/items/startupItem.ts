import * as vscode from 'vscode';
import { MacroRunInfo } from '../../core/execution/macroRunInfo';
import { tryResolveMacroLanguage } from '../../core/language';
import { MacroOptions } from '../../core/macroOptions';
import { StartupMacro } from '../../core/startupMacro';
import { createIcon } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

export const JsStartupIcon = createIcon('symbol-event', 'macros.js');
export const TsStartupIcon = createIcon('symbol-event', 'macros.ts');

export function createStartupItem({ name, uri }: StartupMacro, macroRunInfo?: MacroRunInfo) {
  const item = new vscode.TreeItem(uri);
  item.iconPath = getIcon(uri);
  item.label = name;

  if (macroRunInfo) {
    item.contextValue = 'startupMacro,running';
    item.description = '(active)';
    item.tooltip = getRunInfoTooltip(macroRunInfo);
  } else {
    item.contextValue = 'startupMacro';
    item.description = '(inactive)';
    item.tooltip = 'Startup macro inactive (not yet run, exited, or failed)';
  }

  return item;
}

function getIcon(uri: vscode.Uri): vscode.ThemeIcon | undefined {
  const { language } = tryResolveMacroLanguage(uri) ?? {};
  switch (language?.id) {
    case 'javascript':
      return JsStartupIcon;
    case 'typescript':
      return TsStartupIcon;
    default:
      return undefined;
  }
}

export function getRunInfoTooltip({
  snapshot,
}: MacroRunInfo): string | vscode.MarkdownString | undefined {
  const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
    (k) => snapshot.options[k],
  );
  return (
    'Startup macro is running\n' +
    (options.length ? `Options: ${options.join(', ')}\n` : '') +
    `${formatStartTimestampLabel(snapshot.startedOn)}`
  );
}
