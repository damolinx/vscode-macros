import * as vscode from 'vscode';
import { Context } from '../context';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { isUntitled, resolveUri, UriLocator } from '../utils/uri';

export function setStartupMacro(
  context: Context,
  locator: UriLocator,
  configTarget?: vscode.ConfigurationTarget,
): Promise<void> {
  return setStartupMacros(context, [locator], configTarget);
}

export async function setStartupMacros(
  context: Context,
  locators: UriLocator[],
  configTarget?: vscode.ConfigurationTarget,
): Promise<void> {
  for (const uri of locators.map((loc) => getMacroUriFromStartupMacroUri(resolveUri(loc)))) {
    if (isUntitled(uri)) {
      context.log.info('Cannot set an untitled macro as startup macro', uri.toString(true));
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
