import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { getSandboxExecutionIdToken } from '../../core/execution/sandboxExecutionId';
import { MacroOptions } from '../../core/macroOptions';
import { createIcon } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

export const RunInfoIcon = createIcon('circle-outline', 'macros.general');
export const StartupRunInfoIcon = createIcon('record-small', 'macros.general');

export function createExecutionItem(descriptor: SandboxExecutionDescriptor) {
  const item = new vscode.TreeItem(getSandboxExecutionIdToken(descriptor.id));
  item.contextValue = 'macroRun';
  item.tooltip = getTooltip(descriptor);

  if (descriptor.startup) {
    item.iconPath = StartupRunInfoIcon;
  } else {
    item.iconPath = RunInfoIcon;
  }
  return item;
}

function getTooltip({
  snapshot,
  startedOn,
  startup,
}: SandboxExecutionDescriptor): string | vscode.MarkdownString | undefined {
  const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
    (k) => snapshot.options[k],
  );
  return (
    (startup ? 'Macro executed at startup\n' : '') +
    (options.length ? `Options: ${options.join(', ')}\n` : '') +
    `${formatStartTimestampLabel(startedOn)}\n` +
    `Document revision: ${snapshot.version}`
  );
}
