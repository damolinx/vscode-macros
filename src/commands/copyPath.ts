import * as vscode from 'vscode';
import { explorerTreeView } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, uriBasename } from '../utils/uri';

export async function copyPath(
  { log }: ExtensionContext,
  locator?: Locator,
  nameOnly?: true,
): Promise<void> {
  let targetLocator = locator;
  if (!targetLocator) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection && 'uri' in treeSelection) {
      targetLocator = treeSelection;
    }
  }

  if (targetLocator) {
    const pathOrUri = fromLocator(targetLocator);
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
}
