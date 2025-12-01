import * as vscode from 'vscode';

export type LibraryId = string & { __libraryIdBrand: void };

export function getLibraryId(uri: vscode.Uri): LibraryId {
  const normalizedPath =
    uri.path !== '/' && uri.path.endsWith('/') ? uri.path.slice(0, -1) : uri.path;
  const normalizedUri = uri.with({ fragment: '', query: '', path: normalizedPath });
  return normalizedUri.toString(true) as LibraryId;
}
