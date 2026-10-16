import { Context } from '../context';

export function refreshExplorer(context: Context) {
  context.log.debug('Refresh: refreshed explorer');
  for (const library of context.libraryManager.libraries) {
    library.reset();
  }
}
