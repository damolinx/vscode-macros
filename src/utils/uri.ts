import * as vscode from 'vscode';
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

export function toPath(pathOrUri: PathLike): string {
  return pathOrUri instanceof vscode.Uri ? pathOrUri.fsPath : pathOrUri;
}

export function toUri(pathOrUri: PathLike): vscode.Uri {
  return pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri);
}

/**
 * Checks if two URIs should be considered equal.
 */
export function areUriEqual(locatorA: UriLocator, locatorB: UriLocator): boolean {
  const a = locatorA instanceof vscode.Uri ? locatorA : locatorA.uri;
  const b = locatorB instanceof vscode.Uri ? locatorB : locatorB.uri;
  return a.scheme === b.scheme && a.authority === b.authority && a.path === b.path;
}

/**
 * Check if {@link parent} is a parent of {@link candidate}.
 */
export function isParent(parent: vscode.Uri, candidate: vscode.Uri): boolean {
  if (parent.scheme !== candidate.scheme || parent.authority !== candidate.authority) {
    return false;
  }

  let normalizedParent, normalizedCandidateParent: string;
  if (parent.scheme === 'file') {
    normalizedParent = normalize(parent.fsPath);
    normalizedCandidateParent = normalize(path.dirname(candidate.fsPath));
  } else {
    normalizedParent = parent.path;
    normalizedCandidateParent = posix.dirname(candidate.path);
  }

  return normalizedParent === normalizedCandidateParent || normalizedCandidateParent.startsWith(normalizedParent + path.sep);

  function normalize(path: string) {
    return process.platform === 'win32' ? path.toLowerCase() : path;
  }
}

/**
 * Check if {@link locator} describes an `untitled:` document.
 */
export function isUntitled(locator: UriLocator): boolean {
  const { scheme } = locator instanceof vscode.Uri ? locator : locator.uri;
  return scheme === 'untitled';
}

/**
 * Get parent URI.
 */
export function parent(locator: UriLocator): vscode.Uri {
  const uri = locator instanceof vscode.Uri ? locator : locator.uri;
  return uri.with({ path: posix.dirname(uri.path) });
}

/**
 * Converts a string that represents a path or a URI into a {@link vscode.Uri}
 * instance. This in particular handles Windows paths that confuse the
 * {@link vscode.Uri.parse} method.
 */
export function resolveAsUri(pathOrUri: string): vscode.Uri {
  const candidate = vscode.Uri.parse(pathOrUri);
  return candidate.scheme.length > 1 ? candidate : vscode.Uri.file(pathOrUri);
}

/**
 * Return the last portion of a path. Similar to the Unix basename command.
 */
export function uriBasename(pathOrUri: PathLike, removeExt?: true): string {
  return pathOrUri instanceof vscode.Uri
    ? posix.basename(pathOrUri.path, removeExt && posix.extname(pathOrUri.path))
    : path.basename(pathOrUri, removeExt && path.extname(pathOrUri));
}
