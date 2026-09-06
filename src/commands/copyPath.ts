import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { UriLocator, resolveUri, uriBasename } from '../utils/uri';
import { getTreeSelection } from './utils';

export async function copyPath(
  { explorerTree, log }: ExtensionContext,
  locator?: UriLocator,
  nameOnly?: true,
): Promise<void> {
  const uri = locator ? resolveUri(locator) : getTreeSelection(explorerTree);
  if (!uri) {
    log.info('CopyPath: Nothing to copy');
    return;
  }

  let value: string;
  if (nameOnly) {
    value = uriBasename(uri);
  } else if (uri.scheme === 'file') {
    value = uri.fsPath;
  } else {
    value = uri.toString();
  }

  log.info('Copy value to clipboard', value);
  await vscode.env.clipboard.writeText(value);
}
