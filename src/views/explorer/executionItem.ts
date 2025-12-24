import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { getSandboxExecutionIdToken } from '../../core/execution/sandboxExecutionId';
import { IconColor } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

const RunInfoIcon = new vscode.ThemeIcon('circle-outline', IconColor);
const StartupRunInfoIcon = new vscode.ThemeIcon('record-small', IconColor);

export function createExecutionItem(descriptor: SandboxExecutionDescriptor) {
  const item = new vscode.TreeItem(
    getSandboxExecutionIdToken(descriptor.id),
    vscode.TreeItemCollapsibleState.None,
  );
  item.contextValue = 'macroRun';
  item.iconPath = descriptor.startup ? StartupRunInfoIcon : RunInfoIcon;
  item.tooltip = getTooltip(descriptor);

  return item;
}

function getTooltip({ snapshot, startedOn }: SandboxExecutionDescriptor): string {
  const enabledOptions = Object.entries(snapshot.options)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  let tooltip = enabledOptions.length ? `Options: ${enabledOptions.join(', ')}\n` : '';
  tooltip += `Started: ${formatStartTimestampLabel(startedOn)} • Version: ${snapshot.version}`;
  return tooltip;
}
