import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { resolveMacroExt } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { setContext } from '../extensionContextValues';
import { exists, getFileType } from '../utils/fsEx';
import { isUntitled, parentUri, uriBasename, UriLocator } from '../utils/uri';
import { getUriOrTreeSelection } from './utils';

let savedUri: vscode.Uri | undefined;

function getSource(): vscode.Uri | undefined {
  return savedUri;
}

function setSource(uri: vscode.Uri | undefined): void {
  setContext('macros:canPaste', Boolean(uri));
  savedUri = uri;
}

export async function copyFile({ log }: ExtensionContext, locator?: UriLocator): Promise<void> {
  const uri = getUriOrTreeSelection(
    locator,
    (_, item) => item instanceof Macro && !isUntitled(item.uri),
  );
  if (!uri) {
    log.debug('Copy: Nothing to copy');
    return;
  }

  setSource(uri);
  log.debug('Copy: Copied file', uri.toString(true));
}

export async function pasteFile({ log }: ExtensionContext, locator?: UriLocator): Promise<void> {
  const source = getSource();
  if (!source) {
    log.info('Paste: Nothing to paste');
    return;
  }

  if (!(await exists(source, vscode.FileType.File))) {
    log.warn('Paste: Source does not exist', source.toString(true));
    setSource(undefined);
    return;
  }

  let target = getUriOrTreeSelection(locator);
  if (!target) {
    log.debug('Paste: No target');
    return;
  }

  const type = await getFileType(target);
  if (type && type & vscode.FileType.Directory) {
    log.debug('Paste: Target is a directory', target.toString(true));
  } else if (type && type & vscode.FileType.File) {
    log.debug('Paste: Target is a file, using parent', target.toString(true));
    target = parentUri(target);
  } else {
    log.error('Paste: No valid target', target.toString(true));
    return;
  }

  log.info('Paste file (source, target)', source.toString(true), target.toString(true));
  const targetFile = await safeTargetName(target, source);
  if (!targetFile) {
    throw new Error('Failed to resolve a unique target file name');
  }

  await vscode.workspace.fs.copy(source, targetFile, { overwrite: false });
}

async function safeTargetName(parentUri: vscode.Uri, source: vscode.Uri, maxAttempts = 1000) {
  let uri: vscode.Uri | undefined;

  const ext = resolveMacroExt(source);
  const nameWithoutExt = uriBasename(source, ext ?? true).replace(/(?:\s-)?\s[Cc]opy(\s\d+)?/, '');

  let candidateName = uriBasename(source);
  for (let i = 1; !uri && i <= maxAttempts; i++) {
    const candidate = vscode.Uri.joinPath(parentUri, candidateName);
    if (!(await exists(candidate, vscode.FileType.File))) {
      uri = candidate;
      break;
    }

    candidateName =
      i === 1 ? `${nameWithoutExt} - Copy${ext}` : `${nameWithoutExt} - Copy ${i}${ext}`;
  }

  return uri;
}
