import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export function resetSharedContext({ runnerManager }: ExtensionContext, locator: UriLocator): void {
  const uri = resolveUri(locator);
  const runner = runnerManager.getRunner(uri);
  runner.resetSharedContext();
}
