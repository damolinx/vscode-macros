import * as vscode from 'vscode';

export type MacroLibraryId = string & { __macroLibraryIdBrand: void };

export function getMacroLibraryId(uri: vscode.Uri): MacroLibraryId {
  const normalizedPath =
    uri.path !== '/' && uri.path.endsWith('/') ? uri.path.slice(0, -1) : uri.path;
  const normalizedUri = uri.with({ fragment: '', query: '', path: normalizedPath });
  return normalizedUri.toString(true) as MacroLibraryId;
}
