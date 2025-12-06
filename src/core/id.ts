import * as vscode from 'vscode';

export type Id<T extends string> = string & { __brand: T };

export function getId<T extends string>(uri: vscode.Uri): Id<T> {
  return normalizeUri(uri).toString(true) as Id<T>;
}

export function normalizeUri(uri: vscode.Uri): vscode.Uri {
  if (uri.path !== '/' && uri.path.endsWith('/')) {
    return uri.with({ fragment: '', query: '', path: uri.path.slice(0, -1) });
  }
  if (uri.fragment || uri.query) {
    return uri.with({ fragment: '', query: '' });
  }
  return uri;
}
