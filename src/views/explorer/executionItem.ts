import * as vscode from 'vscode';
import { Execution } from '../../core/execution/execution';
import { getExecutionIdToken } from '../../core/execution/executionId';
import { IconColor } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

const RunInfoIcon = new vscode.ThemeIcon('circle-outline', IconColor);
const StartupRunInfoIcon = new vscode.ThemeIcon('record-small', IconColor);

export function createExecutionItem(execution: Execution): vscode.TreeItem {
  const item = new vscode.TreeItem(
    getExecutionIdToken(execution.id),
    vscode.TreeItemCollapsibleState.None,
  );
  item.contextValue = 'macroRun';
  item.iconPath = execution.startup ? StartupRunInfoIcon : RunInfoIcon;
  item.tooltip = getTooltip(execution);

  return item;
}

function getTooltip({ snapshot, startedOn }: Execution): string {
  const enabledOptions = Object.entries(snapshot.options)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  let tooltip = enabledOptions.length ? `Options: ${enabledOptions.join(', ')}\n` : '';
  tooltip += `Started: ${formatStartTimestampLabel(startedOn)} • Version: ${snapshot.version}`;
  return tooltip;
}
