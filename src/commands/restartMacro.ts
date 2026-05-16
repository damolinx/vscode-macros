import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { resolveUri, UriLocator } from '../utils/uri';
import { runMacro } from './runMacro';

export async function restartMacro(
  context: ExtensionContext,
  locator: UriLocator,
  options?: { ignoreDiagnosticErrors?: true; startup?: true },
): Promise<void> {
  const uri = getMacroUriFromStartupMacroUri(resolveUri(locator));
  const executor = await context.executorManager.ensureExecutor(uri);
  if (executor.executionCount) {
    const executionEndHandler = executor.onExecutionEnd(() => {
      executionEndHandler.dispose();
      return runMacro(context, locator, { ...options, ignoreDiagnosticErrors: true });
    });
    context.executorManager.cancel(uri);
  } else {
    await runMacro(context, locator, options);
  }
}
