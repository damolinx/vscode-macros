import * as vscode from 'vscode';
import { Execution } from '../core/execution/execution';
import { getExecutionIdName, getExecutionIdToken } from '../core/execution/executionId';
import { ExtensionContext } from '../extensionContext';
import { createGroupedQuickPickItems } from '../ui/ui';
import { formatStartTimestampLabel } from '../utils/ui';
import { showTextDocument } from '../utils/vscodeEx';
import { stopMacro } from './stopMacro';

export async function showRunningMacros(context: ExtensionContext): Promise<void> {
  const {
    sandboxManager: { executions },
  } = context;
  if (executions.length === 0) {
    vscode.window.showInformationMessage('No running macros');
    return;
  }

  return new Promise<void>((resolve) => {
    const quickPick = createMacroQuickPick();
    quickPick.onDidAccept(() => {
      quickPick.selectedItems.forEach(({ execution }) => stopMacro(context, execution!));
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
    const buttons = [openButton];
    const quickPick = vscode.window.createQuickPick<
      vscode.QuickPickItem & { execution?: Execution }
    >();
    quickPick.canSelectMany = true;
    quickPick.items = createGroupedQuickPickItems(executions, {
      groupBy: (execution) => getExecutionIdName(execution.id),
      itemBuilder: (execution) =>
        ({
          buttons,
          description: `version: ${execution.snapshot.version}`,
          detail: `started: ${formatStartTimestampLabel(execution.startedOn)}`,
          label: getExecutionIdToken(execution.id),
          execution,
        }) as vscode.QuickPickItem,
    });
    quickPick.matchOnDetail = true;
    quickPick.placeholder = 'Select macros to stop';
    quickPick.onDidTriggerItemButton(async (e) => {
      switch (e.button) {
        case openButton:
          await showTextDocument(e.item.execution!.macro.uri);
          break;
      }
    });

    return quickPick;
  }
}
