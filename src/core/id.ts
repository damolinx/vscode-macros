import * as vscode from 'vscode';

export type Id<T extends string> = string & { readonly __brand: T };

export function createIdFromUri<TId extends Id<string>>(uri: vscode.Uri): TId {
  return normalizeUri(uri).toString(true) as TId;
}

function normalizeUri(uri: vscode.Uri): vscode.Uri {
  let normalizedUri = uri;

  if (normalizedUri.path !== '/' && normalizedUri.path.endsWith('/')) {
    normalizedUri = normalizedUri.with({ path: normalizedUri.path.slice(0, -1) });
  }

  if (normalizedUri.fragment || normalizedUri.query) {
    normalizedUri = normalizedUri.with({ fragment: '', query: '' });
  }

  return normalizedUri;
}
