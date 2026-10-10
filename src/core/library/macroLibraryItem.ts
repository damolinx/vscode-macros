import * as vscode from 'vscode';
import { getMacroId, CodeMacroId } from '../macros/code/codeMacroId';
import { LibraryItem } from './libraryItem';

export function getMacroItem(uri: vscode.Uri): LibraryItem<CodeMacroId> {
  return { id: getMacroId(uri), uri };
}
