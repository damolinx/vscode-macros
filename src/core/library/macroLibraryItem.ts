import * as vscode from 'vscode';
import { getMacroId, MacroId } from '../macroId';
import { LibraryItem } from './libraryItem';

export function getMacroItem(uri: vscode.Uri): LibraryItem<MacroId> {
  return { id: getMacroId(uri), uri };
}
