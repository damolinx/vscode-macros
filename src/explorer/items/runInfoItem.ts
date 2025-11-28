import * as vscode from 'vscode';
import { MacroRunInfo } from '../../core/execution/macroRunInfo';
import { MacroOptions } from '../../core/macroOptions';
import { createIcon } from '../../ui/icons';

export const RunInfoIcon = createIcon('circle-outline', 'macros.general');
export const StartupRunInfoIcon = createIcon('record-small', 'macros.general');

export function createRunInfoItem(runInfo: MacroRunInfo) {
  const item = new vscode.TreeItem(`@${runInfo.runId.index}`);
  item.contextValue = 'macroRun';
  item.tooltip = getTooltip(runInfo);

  if (runInfo.startup) {
    item.description = '(startup)';
    item.iconPath = StartupRunInfoIcon;
  } else {
    item.iconPath = RunInfoIcon;
  }
  return item;

  function getTooltip({ snapshot }: MacroRunInfo): string | vscode.MarkdownString | undefined {
    const options = (Object.keys(snapshot.options) as (keyof MacroOptions)[]).filter(
      (k) => snapshot.options[k],
    );
    return (
      (options.length ? `Options: ${options.join(', ')}\n` : '') +
      `${startedTooltip(snapshot.startedOn)}\n` +
      `Version: ${snapshot.version}`
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

    if (isSameDay) {
      return `Started at ${time}`;
    }

    const day = date.toLocaleDateString([], {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });

    return `Started on ${day} at ${time}`;
  }
}
