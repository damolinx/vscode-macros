import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, uriBasename } from '../utils/uri';

export async function copyPath(
  { log }: ExtensionContext,
  locator: Locator,
  nameOnly?: true,
): Promise<void> {
  const pathOrUri = fromLocator(locator);
  let value: string;
  if (nameOnly) {
    value = uriBasename(pathOrUri);
  } else if (typeof pathOrUri === 'string') {
    value = pathOrUri;
  } else if (pathOrUri.scheme === 'file') {
    value = pathOrUri.fsPath;
  } else {
    value = pathOrUri.toString();
  }

  log.trace('Copy value to clipboard', value);
  await vscode.env.clipboard.writeText(value);
}
