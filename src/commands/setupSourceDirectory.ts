import * as vscode from 'vscode';
import { posix } from 'path';
import { MACRO_DOCUMENT_EXTENSION } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { selectSourceDirectory } from '../ui/selectMacroFile';
import { readFile } from '../utils/resources';
import { PathLike, toUri } from '../utils/uri';

export const GLOBALS_RESOURCE = 'api/global.d.ts';
export const JSCONFIG_RESOURCE = 'api/jsconfig.json';

export function registerSourceDirectoryVerifier(context: ExtensionContext) {
  const verifiedDir = new Set<string>();
  return vscode.workspace.onDidSaveTextDocument(async ({ uri }) => {
    if (!uri.path.endsWith(MACRO_DOCUMENT_EXTENSION)) {
      return;
    }

    const parentPath = posix.dirname(uri.path);
    if (verifiedDir.has(parentPath)) {
      return;
    }

    verifiedDir.add(parentPath);
    await setupSourceDirectory(context, uri.with({ path: parentPath }), true);
  });
}

export async function setupSourceDirectory(
  context: ExtensionContext,
  pathOrUri?: PathLike,
  suppressNotifications?: true,
): Promise<void> {
  const uri = pathOrUri ? toUri(pathOrUri) : await selectSourceDirectory(context.libraryManager);
  if (!uri) {
    return; // Nothing to run.
  }

  const encoder = new TextEncoder();
  const edit = new vscode.WorkspaceEdit();
  const updatingFiles = (
    await Promise.all([
      update(uri, GLOBALS_RESOURCE, 'global.d.ts'),
      update(uri, JSCONFIG_RESOURCE, 'jsconfig.json'),
    ])
  ).some((result) => result);

  if (!updatingFiles) {
    if (!suppressNotifications) {
      vscode.window.showInformationMessage('All files are up-to-date.');
    }
    return; // Nothing to update.
  }

  const result = await vscode.workspace.applyEdit(edit);
  if (!suppressNotifications) {
    if (result) {
      vscode.window.showInformationMessage('Updated files to the latest versions.');
    } else {
      vscode.window.showErrorMessage(`Could not update ${uri.fsPath}`);
    }
  }

  async function update(uri: vscode.Uri, source: string, target: string): Promise<boolean> {
    const [currentContents, newContents] = await Promise.all([
      vscode.workspace.openTextDocument(vscode.Uri.joinPath(uri, target)).then(
        (d) => d.getText(),
        () => '',
      ),
      readFile(context.extensionContext, source),
    ]);
    if (currentContents === newContents) {
      return false;
    }

    edit.createFile(vscode.Uri.joinPath(uri, target), {
      overwrite: true,
      contents: encoder.encode(newContents),
    });

    return true;
  }
}
