import * as vscode from 'vscode';
import { SandboxExecution } from '../core/execution/sandboxExecution';
import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { ExtensionContext } from '../extensionContext';
import { resolveUri } from '../utils/uri';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { SandboxExecutionId } from '../core/execution/sandboxExecutionId';
import { formatDisplayUri } from '../utils/ui';

export async function stopMacro(
  { log, sandboxManager }: ExtensionContext,
  target: Macro | SandboxExecution | StartupMacro | vscode.Uri,
): Promise<void> {
  let canceledExecutionIds: SandboxExecutionId[];
  let logLocator: string;

  if (target instanceof SandboxExecution) {
    target.cts.cancel();
    canceledExecutionIds = [target.id];
    logLocator = target.id;
  } else {
    const resolvedUri = resolveUri(target);
    logLocator = formatDisplayUri(resolvedUri);

    const uri = getMacroUriFromStartupMacroUri(resolvedUri);
    canceledExecutionIds = sandboxManager.cancel(uri).map(({ id }) => id);
  }

  if (canceledExecutionIds.length === 0) {
    log.info('No executions to cancel', logLocator);
  } else {
    log.info('Cancellation requested', ...canceledExecutionIds);
  }
}
