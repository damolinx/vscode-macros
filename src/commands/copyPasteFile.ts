import * as vscode from 'vscode';
import { extname } from 'path';
import { tryResolveMacroExt } from '../core/language';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { explorerTreeView } from '../explorer/explorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { setContext } from '../extensionContextValues';
import { fromLocator, Locator, parent, toUri, uriBasename } from '../utils/uri';

let savedUri: vscode.Uri | undefined;

function getSource(): vscode.Uri | undefined {
  return savedUri;
}

function setSource(uri: vscode.Uri | undefined): void {
  setContext('macros:canPaste', Boolean(uri));
  savedUri = uri;
}

export async function copyFile({ log }: ExtensionContext, locator?: Locator): Promise<void> {
  let source: vscode.Uri | undefined;

  if (locator) {
    source = toUri(fromLocator(locator));
    if (
      !(await vscode.workspace.fs.stat(source).then(
        (s) => s.type === vscode.FileType.File,
        () => false,
      ))
    ) {
      log.warn('Copy: Source is not a file', source.toString(true));
      setSource(undefined);
      return;
    }
  } else {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection instanceof Macro) {
      source = treeSelection.uri;
    }
  }

  if (source) {
    setSource(source);
    log.info('Copy file', source.toString(true));
  } else {
    log.info('Copy: No file to copy');
  }
}

export async function pasteFile({ log }: ExtensionContext, locator: Locator): Promise<void> {
  const source = getSource();
  if (!source) {
    log.warn('Paste: No file to paste');
    return;
  }

  if (
    !(await vscode.workspace.fs.stat(source).then(
      () => true,
      () => false,
    ))
  ) {
    log.warn('Paste: Source file does not exist', source.toString(true));
    setSource(undefined);
    return;
  }

  let targetDir: vscode.Uri | undefined;
  if (locator) {
    targetDir = toUri(fromLocator(locator));
  } else {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection instanceof MacroLibrary || treeSelection instanceof Macro) {
      targetDir = treeSelection.uri;
    }
  }
  if (!targetDir) {
    log.info('Paste: No target directory (no locator)');
    return;
  }

  const type = await vscode.workspace.fs.stat(targetDir).then(
    (s) => s.type,
    () => undefined,
  );
  switch (type) {
    case undefined:
      log.error('Paste: Target does not exist', targetDir.toString(true));
      targetDir = undefined;
      break;
    case vscode.FileType.Directory:
      log.trace('Paste: Target is a directory', targetDir.toString(true));
      break;
    default:
      targetDir = parent(targetDir);
      log.trace('Paste: Target is a file, using parent', targetDir.toString(true));
      break;
  }

  if (!targetDir) {
    log.info('Paste: No target directory (not resolved)');
    return;
  }

  log.info('Paste file', source.toString(true), 'to', targetDir.toString(true));

  const targetFile = await safeTargetName(targetDir, uriBasename(source));
  if (!targetFile) {
    throw new Error('Could not find a target file name');
  }

  await vscode.workspace.fs.copy(source, targetFile, { overwrite: false });
}

async function safeTargetName(parentUri: vscode.Uri, name: string, maxAttempts = 1000) {
  let uri: vscode.Uri | undefined;

  const ext = tryResolveMacroExt(name) || extname(name);
  const nameWithoutExt = uriBasename(name, ext).replace(/\scopy(\s\d+)?/, '');
  let candidateName = name;
  for (let i = 1; !uri && i <= maxAttempts; i++) {
    const candidate = vscode.Uri.joinPath(parentUri, candidateName);
    if (
      await vscode.workspace.fs.stat(candidate).then(
        () => false,
        () => true,
      )
    ) {
      uri = candidate;
      break;
    }

    candidateName = i === 1 ? `${nameWithoutExt} copy${ext}` : `${nameWithoutExt} copy ${i}${ext}`;
  }

  return uri;
}
