import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../core/execution/sandboxExecutionDescriptor';
import {
  getSandboxExecutionIdName,
  getSandboxExecutionIdToken,
} from '../core/execution/sandboxExecutionId';
import { ExtensionContext } from '../extensionContext';
import { createGroupedQuickPickItems } from '../ui/ui';
import { formatStartTimestampLabel } from '../utils/ui';
import { showTextDocument } from '../utils/vscodeEx';
import { removeStartupMacro } from './removeStartupMacro';
import { stopMacro } from './stopMacro';

export async function showRunningMacros(context: ExtensionContext) {
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
      quickPick.selectedItems.forEach(({ descriptor }) => stopMacro(context, descriptor!));
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
      vscode.QuickPickItem & { descriptor?: SandboxExecutionDescriptor }
    >();
    quickPick.canSelectMany = true;
    quickPick.items = createGroupedQuickPickItems(executions, {
      groupBy: (execution) => getSandboxExecutionIdName(execution.id),
      itemBuilder: (execution) =>
        ({
          buttons: execution.startup ? startupButtons : buttons,
          description: `version: ${execution.snapshot.version}`,
          detail: `started: ${formatStartTimestampLabel(execution.startedOn)}`,
          label: getSandboxExecutionIdToken(execution.id),
          descriptor: execution,
        }) as vscode.QuickPickItem,
    });
    quickPick.matchOnDetail = true;
    quickPick.placeholder = 'Select macros to stop';
    quickPick.onDidTriggerItemButton(async (e) => {
      switch (e.button) {
        case openButton:
          await showTextDocument(e.item.descriptor!.macro.uri);
          break;
        case removeStartupButton:
          await removeStartupMacro(context, e.item.descriptor!.macro);
          break;
      }
    });

    return quickPick;
  }
}
