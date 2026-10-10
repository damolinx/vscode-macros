import * as vscode from 'vscode';
import { createIdFromUri, Id } from './id';

export type MacroId = Id<'Macro'>;

export function getMacroId(uri: vscode.Uri): MacroId {
  return createIdFromUri<MacroId>(uri);
}
