import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';

export async function stopMacro(
  context: ExtensionContext,
  uriOrMacroOrRunInfo: vscode.Uri | Macro | MacroRunInfo,
  options?: { noPrompt?: true },
) {
  let runInfos: MacroRunInfo[];
  if (uriOrMacroOrRunInfo instanceof Macro || uriOrMacroOrRunInfo instanceof vscode.Uri) {
    runInfos = [...context.runnerManager.getRunner(uriOrMacroOrRunInfo).runInstances];
    if (
      runInfos.length > 1 &&
      options?.noPrompt !== true &&
      !(await vscode.window.showInformationMessage(
        `Do you want to stop all ${runInfos.length} macro instances?`,
        {
          modal: true,
          detail:
            'Macros cannot be forcefully stopped. This sends a cancellation request via the `__cancellationToken`.',
        },
        'Request Stop',
      ))
    ) {
      return;
    }
  } else {
    runInfos = [uriOrMacroOrRunInfo];
  }

  for (const runInfo of runInfos) {
    runInfo.cts.cancel();
  }
}
