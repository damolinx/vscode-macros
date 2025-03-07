import * as vscode from 'vscode';
import { readFile } from '../common/resources';
import { selectSourceDirectory } from '../common/selectMacroFile';
import { UriHelpers } from '../common/vscodeEx';

export const GLOBALS_RESOURCE = 'api/global.d.ts';
export const JSCONFIG_RESOURCE = 'api/jsconfig.json';

export async function setupSourceDirectory(context: vscode.ExtensionContext, pathOrUri?: string | vscode.Uri): Promise<void> {
  const uri = pathOrUri ? UriHelpers.toUri(pathOrUri) : await selectSourceDirectory();
  if (!uri) {
    return; // Nothing to run.
  }

  const encoder = new TextEncoder();
  const edit = new vscode.WorkspaceEdit();

  let updatingFiles = false;
  for (const [source, target] of
    [[GLOBALS_RESOURCE, 'global.d.ts'], [JSCONFIG_RESOURCE, 'jsconfig.json']]) {

    const [currentContents, newContents] = await Promise.all([
      vscode.workspace.openTextDocument(vscode.Uri.joinPath(uri, target))
        .then((d) => d.getText(), () => undefined),
      readFile(context, source),
    ]);

    if (currentContents !== newContents) {
      updatingFiles = true;
      edit.createFile(vscode.Uri.joinPath(uri, target), {
        overwrite: true,
        contents: encoder.encode(newContents),
      });
    }
  }

  if (!updatingFiles) {
    vscode.window.showInformationMessage('All files used to support macro development are up-to-date.');
  } else if (await vscode.workspace.applyEdit(edit)) {
    vscode.window.showInformationMessage('Updated files used to support macro development to the latest version.');
  }
}