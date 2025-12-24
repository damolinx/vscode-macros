import * as vscode from 'vscode';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';
import { isUntitled, resolveUri, UriLocator } from '../utils/uri';

export function setStartupMacro(
  context: ExtensionContext,
  locator: UriLocator,
  target?: vscode.ConfigurationTarget,
) {
  return setStartupMacros(context, [locator], target);
}

export async function setStartupMacros(
  context: ExtensionContext,
  locators: UriLocator[],
  configTarget?: vscode.ConfigurationTarget,
) {
  for (const uri of locators.map((loc) => getMacroUriFromStartupMacroUri(resolveUri(loc)))) {
    if (isUntitled(uri)) {
      context.log.info('Cannot set an untitled macro as startup macro', uri.toString());
      continue;
    }

    const { added, target, value } = await context.startupManager.addLibrary(uri, configTarget);
    context.log.info(
      added ? 'Added startup macro' : 'Startup already registered',
      vscode.ConfigurationTarget[target],
      value,
    );
  }
}
