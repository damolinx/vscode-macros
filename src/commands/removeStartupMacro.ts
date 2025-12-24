import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export async function removeStartupMacro(
  context: ExtensionContext,
  locator: UriLocator,
): Promise<boolean> {
  const uri = resolveUri(locator);
  const removed = await context.startupManager.removeSourceFor(uri);

  context.log.info(
    removed ? 'Removed startup macro' : 'Macro not registered for startup',
    uri.toString(true),
  );

  return removed;
}
