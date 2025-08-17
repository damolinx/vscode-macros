import * as vscode from 'vscode';
import * as path from 'path';
import { posix } from 'path/posix';

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

export function uriBasename(pathOrUri: PathLike, removeExtension = false): string {
  return pathOrUri instanceof vscode.Uri
    ? posix.basename(pathOrUri.path, removeExtension ? posix.extname(pathOrUri.path) : undefined)
    : path.basename(pathOrUri, removeExtension ? path.extname(pathOrUri) : undefined);
}

export function uriExtname(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? posix.extname(pathOrUri.path) : path.extname(pathOrUri);
}

export function uriDirname(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? posix.dirname(pathOrUri.path) : path.dirname(pathOrUri);
}
