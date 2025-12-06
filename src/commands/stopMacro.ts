import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';

export async function stopMacro(
  { log, runnerManager }: ExtensionContext,
  uriOrMacroOrRunInfo: vscode.Uri | Macro | MacroRunInfo,
) {
  const runInfos: MacroRunInfo[] =
    uriOrMacroOrRunInfo instanceof Macro || uriOrMacroOrRunInfo instanceof vscode.Uri
      ? [...runnerManager.getRunner(uriOrMacroOrRunInfo).runInstances]
      : [uriOrMacroOrRunInfo];

  for (const runInfo of runInfos) {
    log.info('Requesting macro instance to stop via cancellation token', runInfo.runId);
    runInfo.cts.cancel();
  }
}
