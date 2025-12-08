import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';

export async function stopMacro(
  { log, runnerManager }: ExtensionContext,
  locator: vscode.Uri | Macro | MacroRunInfo | StartupMacro,
) {
  const uri =
    locator instanceof vscode.Uri
      ? locator
      : 'uri' in locator
        ? getMacroUriFromStartupMacroUri(locator.uri)
        : undefined;

  const runInfos: MacroRunInfo[] = uri
    ? [...runnerManager.getRunner(uri).runInstances]
    : [locator as MacroRunInfo];

  log.info('Stopping macros via cancellation token —', ...runInfos.map(({ runId }) => runId));
  runInfos.forEach(({ cts }) => cts.cancel());
}
