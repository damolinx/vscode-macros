import * as vscode from 'vscode';
import { getMacroRunIdToken } from '../../core/execution/macroRunId';
import { MacroRunInfo } from '../../core/execution/macroRunInfo';
import { MacroOptions } from '../../core/macroOptions';
import { createIcon } from '../../ui/icons';
import { formatStartTimestampLabel } from '../../utils/ui';

export const RunInfoIcon = createIcon('circle-outline', 'macros.general');
export const StartupRunInfoIcon = createIcon('record-small', 'macros.general');

export function createRunInfoItem(runInfo: MacroRunInfo) {
  const item = new vscode.TreeItem(getMacroRunIdToken(runInfo.runId));
  item.contextValue = 'macroRun';
  item.tooltip = getRunInfoTooltip(runInfo);

  if (runInfo.startup) {
    item.iconPath = StartupRunInfoIcon;
  } else {
    item.iconPath = RunInfoIcon;
  }
  return item;
}

export function getRunInfoTooltip({
  snapshot,
  startup,
}: MacroRunInfo): string | vscode.MarkdownString | undefined {
  const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
    (k) => snapshot.options[k],
  );
  return (
    (startup ? 'Macro executed at startup\n' : '') +
    (options.length ? `Options: ${options.join(', ')}\n` : '') +
    `${formatStartTimestampLabel(snapshot.startedOn)}\n` +
    `Document revision: ${snapshot.version}`
  );
}
