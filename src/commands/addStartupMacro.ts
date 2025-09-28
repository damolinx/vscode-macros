import * as vscode from 'vscode';
import { StartupMacroLibrarySourceManager } from '../core/library/startupMacroLibrarySourceManager';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function addStartupMacro(context: ExtensionContext, locator: Locator) {
  const uri = toUri(fromLocator(locator));
  const {
    added,
    target: scope,
    value,
  } = await StartupMacroLibrarySourceManager.instance.addLibrary(uri);
  context.log.info(
    added ? 'Added startup macro' : 'Startup already registered',
    `(${vscode.ConfigurationTarget[scope]})`,
    '—',
    value,
  );
}
