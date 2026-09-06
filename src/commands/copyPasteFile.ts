import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { resolveMacroInfo } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { setContext } from '../extensionContextValues';
import { exists, getFileType } from '../utils/fsEx';
import { formatDisplayUri } from '../utils/ui';
import { isUntitled, parentUri, resolveUri, uriBasename, UriLocator } from '../utils/uri';
import { getTreeSelection } from './utils';

let savedUri: vscode.Uri | undefined;

function getSource(): vscode.Uri | undefined {
  return savedUri;
}

function setSource(uri?: vscode.Uri): void {
  setContext('macros:canPaste', Boolean(uri));
  savedUri = uri;
}

export async function copyFile(
  { explorerTree, log }: ExtensionContext,
  locator?: UriLocator,
): Promise<void> {
  const uri = locator
    ? resolveUri(locator)
    : getTreeSelection(explorerTree, (item) => item instanceof Macro && !isUntitled(item.uri));
  if (!uri) {
    log.info('Copy: Nothing to copy');
    return;
  }

  setSource(uri);
  log.debug('Copy: Copied file', formatDisplayUri(uri));
}

export async function pasteFile(
  { explorerTree, log }: ExtensionContext,
  locator?: UriLocator,
): Promise<void> {
  const source = getSource();
  if (!source) {
    log.info('Paste: Nothing to paste');
    return;
  }

  if (!(await exists(source, vscode.FileType.File))) {
    log.warn('Paste: File does not exist', formatDisplayUri(source));
    setSource();
    return;
  }

  let uri = locator
    ? resolveUri(locator)
    : getTreeSelection(explorerTree, (item) => item instanceof Macro && !isUntitled(item.uri));
  if (!uri) {
    log.info('Paste: No target');
    return;
  }

  const type = await getFileType(uri);
  if (type && type & vscode.FileType.Directory) {
    log.debug('Paste: Target is a directory', formatDisplayUri(uri));
  } else if (type && type & vscode.FileType.File) {
    log.debug('Paste: Target is a file, using parent', formatDisplayUri(uri));
    uri = parentUri(uri);
  } else {
    log.error('Paste: No valid target', formatDisplayUri(uri));
    return;
  }

  log.info('Paste: Paste file (source, target)', formatDisplayUri(source), formatDisplayUri(uri));
  const targetFile = await safeTargetName(uri, source);
  if (!targetFile) {
    throw new Error('Failed to resolve a unique target file name');
  }

  await vscode.workspace.fs.copy(source, targetFile, { overwrite: false });
}

async function safeTargetName(parent: vscode.Uri, source: vscode.Uri, maxAttempts = 1000) {
  const ext = resolveMacroInfo(source)?.extension;
  const nameWithoutExt = uriBasename(source, ext ?? true).replace(/(?:\s-)?\s[Cc]opy(\s\d+)?/, '');

  let candidateName = uriBasename(source);
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = vscode.Uri.joinPath(parent, candidateName);
    if (!(await exists(candidate, vscode.FileType.File))) {
      return candidate;
    }

    candidateName =
      i === 1 ? `${nameWithoutExt} - Copy${ext}` : `${nameWithoutExt} - Copy ${i}${ext}`;
  }

  return;
}
