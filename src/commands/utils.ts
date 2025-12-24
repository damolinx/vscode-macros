import * as vscode from 'vscode';
import { resolveUri, UriLocator } from '../utils/uri';
import { TreeElement } from '../views/explorer/explorerTreeDataProvider';
import { explorerTreeView } from '../views/treeViews';

export function getUriOrTreeSelection(
  locator?: UriLocator,
  filter?: (uri: vscode.Uri, item?: TreeElement) => boolean,
): vscode.Uri | undefined {
  if (locator) {
    const uri = resolveUri(locator);
    return !filter || filter(uri) ? uri : undefined;
  }

  const treeSelection = explorerTreeView?.selection[0];
  if (
    treeSelection &&
    'uri' in treeSelection &&
    (!filter || filter(treeSelection.uri, treeSelection))
  ) {
    return treeSelection.uri;
  }

  return undefined;
}
