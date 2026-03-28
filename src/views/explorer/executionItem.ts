import * as vscode from 'vscode';
import { SandboxExecution } from '../../core/execution/sandboxExecution';
import { getSandboxExecutionIdToken } from '../../core/execution/sandboxExecutionId';
import { IconColor } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

const RunInfoIcon = new vscode.ThemeIcon('circle-outline', IconColor);
const StartupRunInfoIcon = new vscode.ThemeIcon('record-small', IconColor);

export function createExecutionItem(descriptor: SandboxExecution): vscode.TreeItem {
  const item = new vscode.TreeItem(
    getSandboxExecutionIdToken(descriptor.id),
    vscode.TreeItemCollapsibleState.None,
  );
  item.contextValue = 'macroRun';
  item.iconPath = descriptor.startup ? StartupRunInfoIcon : RunInfoIcon;
  item.tooltip = getTooltip(descriptor);

  return item;
}

function getTooltip({ snapshot, startedOn }: SandboxExecution): string {
  const enabledOptions = Object.entries(snapshot.options)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  let tooltip = enabledOptions.length ? `Options: ${enabledOptions.join(', ')}\n` : '';
  tooltip += `Started: ${formatStartTimestampLabel(startedOn)} • Version: ${snapshot.version}`;
  return tooltip;
}
