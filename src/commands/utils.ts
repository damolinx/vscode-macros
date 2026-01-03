import * as vscode from 'vscode';
import { MacroFilter } from '../utils/ui';
import { resolveUri, UriLocator } from '../utils/uri';
import { saveTextEditor } from '../utils/vscodeEx';
import { TreeElement } from '../views/explorer/explorerTreeDataProvider';
import { explorerTreeView } from '../views/treeViews';

export async function activeMacroEditor(
  ensureSaved: boolean,
): Promise<vscode.TextEditor | undefined> {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return editor; // No active editor.
  }

  if (editor.document.isDirty && ensureSaved) {
    editor = await saveTextEditor(editor, { filters: MacroFilter });
  }
  return editor;
}

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
