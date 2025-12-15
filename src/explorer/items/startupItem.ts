import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { tryResolveMacroLanguage } from '../../core/language';
import { MacroOptions } from '../../core/macroOptions';
import { StartupMacro } from '../../core/startupMacro';
import { createIcon } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

export const JsStartupIcon = createIcon('symbol-event', 'macros.js');
export const TsStartupIcon = createIcon('symbol-event', 'macros.ts');

export function createStartupItem(
  { name, uri }: StartupMacro,
  descriptor?: SandboxExecutionDescriptor,
) {
  const item = new vscode.TreeItem(uri);
  item.iconPath = getIcon(uri);
  item.label = name;

  if (descriptor) {
    item.contextValue = 'startupMacro,running';
    item.description = '(active)';
    item.tooltip = getTooltip(descriptor);
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

function getTooltip({
  snapshot,
  startedOn,
}: SandboxExecutionDescriptor): string | vscode.MarkdownString | undefined {
  const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
    (k) => snapshot.options[k],
  );
  return (
    'Startup macro is running\n' +
    (options.length ? `Options: ${options.join(', ')}\n` : '') +
    `${formatStartTimestampLabel(startedOn)}`
  );
}
