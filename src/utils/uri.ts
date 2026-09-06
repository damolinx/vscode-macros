import * as vscode from 'vscode';
import * as path from 'path';
import { posix } from 'path/posix';

export type PathLike = string | vscode.Uri;
export type UriLocator = vscode.Uri | { uri: vscode.Uri };

/**
 * Checks if two URIs should be considered equal.
 */
export function areUriEqual(locatorA: UriLocator, locatorB: UriLocator): boolean {
  const a = resolveUri(locatorA);
  const b = resolveUri(locatorB);
  return (
    a.scheme === b.scheme &&
    a.authority === b.authority &&
    (a.scheme === 'file'
      ? normalizePathCase(a.fsPath) === normalizePathCase(b.fsPath)
      : a.path === b.path)
  );
}

/**
 * Check if {@link parent} is a parent of {@link candidate}.
 */
export function isParent(
  parent: vscode.Uri,
  candidate: vscode.Uri,
  options?: { mustBeImmediate?: true },
): boolean {
  if (parent.scheme !== candidate.scheme || parent.authority !== candidate.authority) {
    return false;
  }

  let normalizedParent: string;
  let normalizedCandidateParent: string;
  let sep: string;

  if (parent.scheme === 'file') {
    normalizedParent = normalizePathCase(parent.fsPath);
    normalizedCandidateParent = normalizePathCase(path.dirname(candidate.fsPath));
    sep = path.sep;
  } else {
    normalizedParent = parent.path;
    normalizedCandidateParent = posix.dirname(candidate.path);
    sep = posix.sep;
  }

  return (
    normalizedParent === normalizedCandidateParent ||
    (!options?.mustBeImmediate && normalizedCandidateParent.startsWith(normalizedParent + sep))
  );
}

/**
 * Check if {@link locator} describes an `untitled:` document.
 */
export function isUntitled(locator: UriLocator): boolean {
  return resolveUri(locator).scheme === 'untitled';
}

function normalizePathCase(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

/**
 * Get parent URI.
 */
export function parentUri(locator: UriLocator): vscode.Uri {
  const uri = resolveUri(locator);
  return vscode.Uri.joinPath(uri, '..');
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
 * Resolve {@link locator} into a {@link vscode.Uri} instance.
 */
export function resolveUri(locator: UriLocator): vscode.Uri {
  return locator instanceof vscode.Uri ? locator : locator.uri;
}

/**
 * Return the last portion of a path. Similar to the Unix basename command.
 */
export function uriBasename(pathOrUri: PathLike, removeExt?: true | string): string {
  return pathOrUri instanceof vscode.Uri
    ? posix.basename(
        pathOrUri.path,
        removeExt && (typeof removeExt === 'string' ? removeExt : path.extname(pathOrUri.path)),
      )
    : path.basename(
        pathOrUri,
        removeExt && (typeof removeExt === 'string' ? removeExt : path.extname(pathOrUri)),
      );
}
