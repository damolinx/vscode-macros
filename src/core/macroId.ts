import * as vscode from 'vscode';

export type MacroId = string & { __macroIdBrand: void };

export function getMacroId(uri: vscode.Uri): MacroId {
  const normalizedUri = uri.with({ fragment: '', query: '' });
  return normalizedUri.toString(true) as MacroId;
}
