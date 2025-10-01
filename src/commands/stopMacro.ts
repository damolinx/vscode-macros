import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';

export async function stopMacro(
  context: ExtensionContext,
  uriOrMacroOrRunInfo: vscode.Uri | Macro | MacroRunInfo,
) {
  const runInfos: MacroRunInfo[] =
    uriOrMacroOrRunInfo instanceof Macro || uriOrMacroOrRunInfo instanceof vscode.Uri
      ? [...context.runnerManager.getRunner(uriOrMacroOrRunInfo).runInstances]
      : [uriOrMacroOrRunInfo];

  for (const runInfo of runInfos) {
    runInfo.cts.cancel();
  }
}
