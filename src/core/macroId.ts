import * as vscode from 'vscode';
import { getId, Id } from './id';

export type MacroId = Id<'Macro'>;

export function getMacroId(uri: vscode.Uri): MacroId {
  return getId<'Macro'>(uri);
}
