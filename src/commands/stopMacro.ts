import * as vscode from 'vscode';
import { Context } from '../context';
import { Execution } from '../core/execution/execution';
import { ExecutionId } from '../core/execution/executionId';
import { CodeMacro } from '../core/macros/code/codeMacro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { formatDisplayUri } from '../utils/ui';
import { resolveUri } from '../utils/uri';

export async function stopMacro(
  { log, executorManager }: Context,
  target: CodeMacro | Execution | StartupMacro | vscode.Uri,
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
    canceledExecutionIds = executorManager.cancel(uri).map(({ id }) => id);
  }

  if (canceledExecutionIds.length === 0) {
    log.info('No executions to cancel', logLocator);
  } else {
    log.info('Cancellation requested —', ...canceledExecutionIds);
  }
}
