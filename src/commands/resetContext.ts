import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export function resetSharedContext(
  { sandboxManager }: ExtensionContext,
  locator: UriLocator,
): void {
  const uri = resolveUri(locator);
  const executor = sandboxManager.getExecutor(uri);
  executor?.resetSharedContext();
}
