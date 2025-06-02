import * as vscode from 'vscode';

export type PathLike = string | vscode.Uri;

export function isUntitled(pathOrUri: PathLike): boolean {
  return pathOrUri instanceof vscode.Uri && pathOrUri.scheme === 'untitled';
}

export function toPath(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? pathOrUri.fsPath : pathOrUri;
}

export function toUri(pathOrUri: PathLike): vscode.Uri {
  return pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri);
}
