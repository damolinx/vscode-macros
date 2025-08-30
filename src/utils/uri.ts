import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { posix } from 'path/posix';

export type PathLike = string | vscode.Uri;
export type Locator = PathLike | { path: string } | { uri: vscode.Uri };
export type UriLocator = vscode.Uri | { uri: vscode.Uri };
export function fromLocator(locator: Locator): PathLike {
  if (locator instanceof vscode.Uri || typeof locator === 'string') {
    return locator;
  } else if ('uri' in locator) {
    return locator.uri;
  } else {
    return locator.path;
  }
}

export function asTildeRelativePath(pathOrUri: PathLike): string | undefined {
  if (process.platform === 'win32') {
    // Windows has no concept of `tilde` and VSCode uses some unique casing behaviors.
    return;
  }
  const uri = toUri(pathOrUri);
  if (uri.scheme !== 'file') {
    return;
  }

  let homedir = os.homedir();
  if (!homedir.endsWith(posix.sep)) {
    homedir += posix.sep;
  }

  return uri.fsPath.startsWith(homedir)
    ? `~${posix.sep}${uri.fsPath.slice(homedir.length)}`
    : undefined;
}

export function asWorkspaceRelativePath(locator: Locator): string {
  return vscode.workspace.asRelativePath(fromLocator(locator));
}

export function isParent(parent: vscode.Uri, candidate: vscode.Uri): boolean {
  if (parent.scheme !== candidate.scheme || parent.authority !== candidate.authority) {
    return false;
  }

  const normalizedParent = parent.scheme === 'file' ? normalize(parent.fsPath) : parent.path;
  const normalizedCandidateParent =
    candidate.scheme === 'file'
      ? path.dirname(normalize(candidate.fsPath))
      : posix.dirname(candidate.path);
  return normalizedParent === normalizedCandidateParent;

  function normalize(path: string) {
    return process.platform === 'win32' ? path.toLowerCase() : path;
  }
}

export function isUntitled(locator: UriLocator): boolean {
  const { scheme } = locator instanceof vscode.Uri ? locator : locator.uri;
  return scheme === 'untitled';
}

export function toPath(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? pathOrUri.fsPath : pathOrUri;
}

export function toParentUri(pathOrUri: PathLike): vscode.Uri {
  const uri = toUri(pathOrUri);
  return uri.with({ path: uriDirname(uri) });
}

export function toUri(pathOrUri: PathLike): vscode.Uri {
  return pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.parse(pathOrUri);
}

export function uriBasename(pathOrUri: PathLike, removeExtension = false): string {
  const uri = toUri(pathOrUri);
  return posix.basename(uri.path, removeExtension ? posix.extname(uri.path) : undefined);
}

export function uriEqual(a: vscode.Uri, b: vscode.Uri): boolean {
  return a.toString() === b.toString();
}

export function uriExtname(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? posix.extname(pathOrUri.path) : path.extname(pathOrUri);
}

export function uriDirname(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? posix.dirname(pathOrUri.path) : path.dirname(pathOrUri);
}
