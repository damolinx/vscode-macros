import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export function resetSharedContext(
  { log, sandboxManager }: ExtensionContext,
  locator: UriLocator,
): void {
  const uri = resolveUri(locator);
  const executor = sandboxManager.getExecutor(uri);
  if (!executor) {
    log.debug('No context to reset', uri.toString(true));
    return;
  }

  executor.resetSharedContext();
}
