import { StartupMacroLibrarySourceManager } from '../core/library/startupMacroLibrarySourceManager';
import { explorerTreeDataProvider } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export async function removeStartupMacro(
  context: ExtensionContext,
  locator: UriLocator,
): Promise<boolean> {
  const uri = resolveUri(locator);
  const removed = await StartupMacroLibrarySourceManager.instance.removeLibrary(uri);

  if (removed) {
    context.log.info('Removed startup macro', uri.toString(true));
    explorerTreeDataProvider?.refresh();
  } else {
    context.log.info('Macro not registered for startup', uri.toString(true));
  }

  return removed;
}
