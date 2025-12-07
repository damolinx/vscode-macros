import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { UriLocator, uriBasename } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

export async function copyPath(
  { log }: ExtensionContext,
  locator?: UriLocator,
  nameOnly?: true,
): Promise<void> {
  const uri = getUriOrTreeSelection(locator);
  if (!uri) {
    return; // Nothing to run.
  }

  let value: string;
  if (nameOnly) {
    value = uriBasename(uri);
  } else if (uri.scheme === 'file') {
    value = uri.fsPath;
  } else {
    value = uri.toString();
  }

  log.trace('Copy value to clipboard', value);
  await vscode.env.clipboard.writeText(value);
}
