import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { ExtensionContext } from '../extensionContext';
import { createGroupedQuickPickItems } from '../ui/ui';
import { showTextDocument } from '../utils/vscodeEx';

export async function showRunningMacros({ runnerManager: { runningMacros } }: ExtensionContext) {
  if (runningMacros.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  const selected = await pickRunningMacro(runningMacros);
  if (!selected) {
    return; // Nothing to do
  }
}

function pickRunningMacro(runInfos: MacroRunInfo[]): Promise<MacroRunInfo | undefined> {
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

    const quickPick = vscode.window.createQuickPick<
      vscode.QuickPickItem & { runInfo?: MacroRunInfo }
    >();
    quickPick.items = createGroupedQuickPickItems(runInfos, {
      groupBy: (runInfo) => runInfo.macro.name,
      itemBuilder: (runInfo) => ({
        buttons,
        detail: runInfo.macro.uri.fsPath,
        label: runInfo.id,
        runInfo,
      }),
    });
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
}
