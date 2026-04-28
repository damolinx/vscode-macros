import * as vscode from 'vscode';
import { Execution } from '../core/execution/execution';
import { ExecutionId } from '../core/execution/executionId';
import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { formatDisplayUri } from '../utils/ui';
import { resolveUri } from '../utils/uri';

export async function stopMacro(
  { log, sandboxManager }: ExtensionContext,
  target: Macro | Execution | StartupMacro | vscode.Uri,
): Promise<void> {
  let canceledExecutionIds: ExecutionId[];
  let logLocator: string;

  if (target instanceof Execution) {
    target.cancel();
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
    log.info('Cancellation requested —', ...canceledExecutionIds);
  }
}
