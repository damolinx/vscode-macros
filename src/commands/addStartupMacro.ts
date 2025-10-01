import * as vscode from 'vscode';
import { StartupMacroLibrarySourceManager } from '../core/library/startupMacroLibrarySourceManager';
import { explorerTreeDataProvider } from '../explorer/macroExplorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function addStartupMacro(context: ExtensionContext, locator: Locator) {
  const uri = toUri(fromLocator(locator));
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
