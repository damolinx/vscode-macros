import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../core/execution/sandboxExecutionDescriptor';
import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { resolveUri } from '../utils/uri';

export async function stopMacro(
  { log, sandboxManager }: ExtensionContext,
  target: Macro | SandboxExecutionDescriptor | StartupMacro | vscode.Uri,
) {
  let canceledDescriptors: SandboxExecutionDescriptor[];

  if (target instanceof SandboxExecutionDescriptor) {
    target.cts.cancel();
    canceledDescriptors = [target];
  } else {
    const uri = getMacroUriFromStartupMacroUri(resolveUri(target));
    canceledDescriptors = sandboxManager.cancel(uri);
  }

  log.info(
    'Requesting macros to stop via cancellation token —',
    ...canceledDescriptors.map(({ id }) => id),
  );
}
