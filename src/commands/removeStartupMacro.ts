import * as vscode from 'vscode';
import { tokenizeUri } from '../core/pathTokenization';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { formatDisplayUri } from '../utils/ui';
import { resolveUri } from '../utils/uri';

export async function removeStartupMacro(
  context: ExtensionContext,
  startupMacroOrUri: StartupMacro | vscode.Uri,
  configTarget?: vscode.ConfigurationTarget,
): Promise<boolean> {
  const uri = getMacroUriFromStartupMacroUri(resolveUri(startupMacroOrUri));
  const target =
    startupMacroOrUri instanceof StartupMacro ? startupMacroOrUri.target : configTarget;
  const removed = await context.startupManager.removeSourceFor(uri, target);

  context.log.info(
    removed ? 'Removed startup macro' : 'Macro not registered for startup',
    target ? vscode.ConfigurationTarget[target] : '<all scopes>',
    tokenizeUri(uri).tokenizedSource ?? formatDisplayUri(uri),
  );

  return removed;
}
