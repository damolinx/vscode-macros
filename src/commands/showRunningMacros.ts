import * as vscode from 'vscode';
import { getMacroRunIdName, getMacroRunIdToken } from '../core/execution/macroRunId';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { ExtensionContext } from '../extensionContext';
import { createGroupedQuickPickItems } from '../ui/ui';
import { showTextDocument } from '../utils/vscodeEx';
import { removeStartupMacro } from './removeStartupMacro';
import { stopMacro } from './stopMacro';

export async function showRunningMacros(context: ExtensionContext) {
  const {
    runnerManager: { runningMacros },
  } = context;
  if (runningMacros.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  return new Promise<void>((resolve) => {
    const quickPick = createMacroQuickPick();
    quickPick.onDidAccept(() => {
      quickPick.selectedItems.forEach(({ runInfo }) => stopMacro(context, runInfo!));
      quickPick.hide();
      resolve();
    });
    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve();
    });
    quickPick.show();
  });

  function createMacroQuickPick() {
    const openButton = {
      iconPath: new vscode.ThemeIcon('go-to-file'),
      tooltip: 'Open macro file',
    };
    const removeStartupButton = {
      iconPath: new vscode.ThemeIcon('remove-close'),
      tooltip: 'Remove as startup macro',
    };
    const buttons = [openButton];
    const startupButtons = [removeStartupButton, openButton];

    const quickPick = vscode.window.createQuickPick<
      vscode.QuickPickItem & { runInfo?: MacroRunInfo }
    >();
    quickPick.canSelectMany = true;
    quickPick.items = createGroupedQuickPickItems(runningMacros, {
      groupBy: (runInfo) => getMacroRunIdName(runInfo.runId),
      itemBuilder: (runInfo) =>
        ({
          buttons: runInfo.startup ? startupButtons : buttons,
          description: `version: ${runInfo.snapshot.version}`,
          detail: `started: ${new Date(runInfo.snapshot.startedOn).toLocaleString()}`,
          label: getMacroRunIdToken(runInfo.runId),
          runInfo,
        }) as vscode.QuickPickItem,
    });
    quickPick.matchOnDetail = true;
    quickPick.placeholder = 'Select macros to stop';
    quickPick.onDidTriggerItemButton(async (e) => {
      switch (e.button) {
        case openButton:
          await showTextDocument(e.item.runInfo!.macro.uri);
          break;
        case removeStartupButton:
          await removeStartupMacro(context, e.item.runInfo!.macro);
          break;
      }
    });

    return quickPick;
  }
}
