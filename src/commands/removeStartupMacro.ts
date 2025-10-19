import { StartupMacroLibrarySourceManager } from '../core/library/startupMacroLibrarySourceManager';
import { explorerTreeDataProvider } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function removeStartupMacro(context: ExtensionContext, locator: Locator) {
  const uri = toUri(fromLocator(locator));
  const removed = await StartupMacroLibrarySourceManager.instance.removeLibrary(uri);
  context.log.info(
    removed ? 'Removed startup macro (all contexts)' : 'Macro not registered for startup',
  );

  if (removed) {
    context.log.info('Removed startup macro (all contexts)');
    explorerTreeDataProvider?.refresh();
  } else {
    context.log.info('Macro not registered for startup, nothing to remove');
  }
}
