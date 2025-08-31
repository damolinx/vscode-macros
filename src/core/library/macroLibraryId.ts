import * as vscode from 'vscode';
import { trimTrailingSep } from './utils';

export type MacroLibraryId = string & { __macroLibraryIdBrand: void };

export function getMacroLibraryId(uri: vscode.Uri): MacroLibraryId {
  const normalizedUri = uri.with({ fragment: '', query: '', path: trimTrailingSep(uri.path) });
  return normalizedUri.toString(true) as MacroLibraryId;
}
