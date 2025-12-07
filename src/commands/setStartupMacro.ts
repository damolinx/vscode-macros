import * as vscode from 'vscode';
import { StartupMacroLibrarySourceManager } from '../core/library/startupMacroLibrarySourceManager';
import { explorerTreeDataProvider } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri } from '../utils/uri';

export async function setStartupMacro(context: ExtensionContext, locator: UriLocator) {
  const uri = resolveUri(locator);
  if (!uri) {
    return; // Nothing to run.
  }

  const {
    added,
    target: scope,
    value,
  } = await StartupMacroLibrarySourceManager.instance.addLibrary(uri);

  let logMessage: string;
  if (added) {
    logMessage = 'Added startup macro';
    explorerTreeDataProvider?.refresh();
  } else {
    logMessage = 'Startup already registered';
  }
  context.log.info(logMessage, `(${vscode.ConfigurationTarget[scope]})`, '—', value);
}
