import * as vscode from 'vscode';
import { tryResolveMacroExt } from '../core/language';
import { Macro } from '../core/macro';
import { explorerTreeView } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { setContext } from '../extensionContextValues';
import { existsFile, fsType } from '../utils/fsEx';
import { isUntitled, parent, uriBasename, UriLocator } from '../utils/uri';

let savedUri: vscode.Uri | undefined;

function getSource(): vscode.Uri | undefined {
  return savedUri;
}

function setSource(uri: vscode.Uri | undefined): void {
  setContext('macros:canPaste', Boolean(uri));
  savedUri = uri;
}

export async function copyFile({ log }: ExtensionContext, locator?: UriLocator): Promise<void> {
  let source = locator && locator instanceof vscode.Uri ? locator : locator?.uri;
  if (!source) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection instanceof Macro) {
      source = treeSelection.uri;
    } else {
      log.debug('Copy: Nothing to copy');
      return;
    }
  }

  if (isUntitled(source)) {
    log.debug('Copy: Untitled documents cannot be copied', source.toString(true));
    return;
  }

  setSource(source);
  log.debug('Copy: Copied file', source.toString(true));
}

export async function pasteFile({ log }: ExtensionContext, locator?: UriLocator): Promise<void> {
  const source = getSource();
  if (!source) {
    log.info('Paste: Nothing to paste');
    return;
  }

  if (!(await existsFile(source))) {
    log.warn('Paste: Source does not exist', source.toString(true));
    setSource(undefined);
    return;
  }

  let target = locator && locator instanceof vscode.Uri ? locator : locator?.uri;
  if (!target) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection && 'uri' in treeSelection) {
      target = treeSelection.uri;
    } else {
      log.debug('Paste: No target');
      return;
    }
  }

  switch (await fsType(target)) {
    case undefined:
      log.error('Paste: Target does not exist', target.toString(true));
      target = undefined;
      break;
    case vscode.FileType.Directory:
      log.debug('Paste: Target is a directory', target.toString(true));
      break;
    default:
      log.debug('Paste: Target is a file, using parent', target.toString(true));
      target = parent(target);
      break;
  }

  if (!target) {
    log.info('Paste: No target (unresolved)');
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

  const ext = tryResolveMacroExt(source);
  const name = uriBasename(source);
  const nameWithoutExt = uriBasename(source, ext ?? true).replace(/(?:\s-)?\s[Cc]opy(\s\d+)?/, '');

  let candidateName = name;
  for (let i = 1; !uri && i <= maxAttempts; i++) {
    const candidate = vscode.Uri.joinPath(parentUri, candidateName);
    if (!(await existsFile(candidate))) {
      uri = candidate;
      break;
    }

    candidateName =
      i === 1 ? `${nameWithoutExt} - Copy${ext}` : `${nameWithoutExt} - Copy ${i}${ext}`;
  }

  return uri;
}
