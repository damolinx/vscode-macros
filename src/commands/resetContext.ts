import { ExtensionContext } from '../extensionContext';
import { formatDisplayUri } from '../utils/ui';
import { UriLocator, resolveUri } from '../utils/uri';

export function resetSharedContext(
  { executorManager, log }: ExtensionContext,
  locator: UriLocator,
): void {
  const uri = resolveUri(locator);
  const executor = executorManager.getExecutor(uri);
  if (!executor) {
    log.debug('No context to reset', formatDisplayUri(uri));
    return;
  }

  executor.resetPersistentContext();
}
