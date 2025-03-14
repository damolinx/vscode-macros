import * as vscode from 'vscode';
import { basename } from 'path';
import { Manager } from '../manager';
import { RunInfo } from '../runner';
import { showTextDocument } from '../common/vscodeEx';

export async function showRunningMacros(manager: Manager) {
  const { runningMacros } = manager;
  if (runningMacros.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  const selected = await pickRunningMacro(runningMacros);
  if (!selected) {
    return; // Nothing to do
  }
}

function pickRunningMacro(runInfos: RunInfo[]): Promise<RunInfo | undefined> {
  return new Promise((resolve) => {
    const quickPick = createMacroQuickPick();

    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });

    quickPick.show();
  });

  function createMacroQuickPick() {
    const openButton = {
      iconPath: new vscode.ThemeIcon('go-to-file'),
      tooltip: 'Open File',
    };
    const stopButton = {
      iconPath: new vscode.ThemeIcon('debug-stop'),
      tooltip: 'Request To Stop',
    };
    const buttons = [stopButton, openButton];

    const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem & { runInfo?: RunInfo }>();
    quickPick.items = createQuickPickItems(runInfos, buttons);
    quickPick.matchOnDetail = true;
    quickPick.placeholder = 'Running macros';
    quickPick.onDidTriggerItemButton(async (e) => {
      if (e.button === openButton) {
        await showTextDocument(e.item.runInfo!.macro.uri);
      } else if (e.button === stopButton) {
        e.item.runInfo!.cts.cancel();
        quickPick.hide();
      }
    });
    return quickPick;
  }

  function createQuickPickItems(runInfos: RunInfo[], buttons: vscode.QuickInputButton[]) {
    const groupedByPath = runInfos.reduce((acc, runInfo) => {
      const key = runInfo.macro.uri.fsPath;
      let entries = acc[key];
      if (!entries) {
        entries = [];
        acc[key] = entries;
      }
      entries.push(runInfo);
      return acc;
    }, {} as Record<string, RunInfo[]>);

    const items: (vscode.QuickPickItem & { runInfo?: RunInfo })[] = [];
    Object.keys(groupedByPath)
      .sort((a, b) => a.localeCompare(b))
      .forEach((path) => {
        items.push(
          {
            label: basename(path),
            kind: vscode.QuickPickItemKind.Separator
          },
          ...groupedByPath[path]
            .sort((a, b) => a.runId.localeCompare(b.runId))
            .map((runInfo) => ({
              buttons,
              detail: runInfo.macro.uri.fsPath,
              label: runInfo.runId,
              runInfo,
            })));
      });
    return items;
  }
}
