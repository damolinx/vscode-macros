import { ExtensionContext } from '../extensionContext';

export function refreshExplorer(context: ExtensionContext) {
  context.log.debug('Refresh: refreshed explorer');
  for (const library of context.libraryManager.libraries) {
    library.reset();
  }
}
