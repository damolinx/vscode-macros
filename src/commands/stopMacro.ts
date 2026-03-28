import * as vscode from 'vscode';
import { SandboxExecution } from '../core/execution/sandboxExecution';
import { Macro } from '../core/macro';
import { getMacroId } from '../core/macroId';
import { StartupMacro } from '../core/startupMacro';
import { ExtensionContext } from '../extensionContext';
import { resolveUri } from '../utils/uri';

export async function stopMacro(
  { log, sandboxManager }: ExtensionContext,
  target: Macro | SandboxExecution | StartupMacro | vscode.Uri,
): Promise<void> {
  let canceledExecutions: SandboxExecution[];

  if (target instanceof SandboxExecution) {
    target.cts.cancel();
    canceledExecutions = [target];
  } else {
    const macroId = getMacroId(resolveUri(target));
    canceledExecutions = sandboxManager.cancel(macroId);
  }

  log.info('Cancellation requested', ...canceledExecutions.map(({ id }) => id));
}
