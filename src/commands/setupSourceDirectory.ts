import * as vscode from 'vscode';
import { selectSourceDirectory } from '../common/selectMacroFile';
import { UriHelpers } from '../common/vscodeEx';

export async function setupSourceDirectory(pathOrUri?: string | vscode.Uri): Promise<void> {
  const uri = pathOrUri ? UriHelpers.toUri(pathOrUri) : await selectSourceDirectory();
  if (!uri) {
    return; // Nothing to run.
  }

  const encoder = new TextEncoder();
  const edit = new vscode.WorkspaceEdit();

  for (const [name, newContents] of [
    ['global.d.ts', createGlobalDefs()],
    ['jsconfig.json', createJSConfig()]]) {

    const currentContents = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(uri, name))
      .then((d) => d.getText(), () => undefined);

    if (currentContents !== newContents) {
      edit.createFile(vscode.Uri.joinPath(uri, name), {
        overwrite: true,
        contents: encoder.encode(newContents),
      });
    }
  }

  if (edit.entries().length === 0) {
    vscode.window.showInformationMessage('All files used to support macro development are up-to-date.');
  } else if (await vscode.workspace.applyEdit(edit)) {
    vscode.window.showInformationMessage('Updated files used to support macro development to the latest version.');
  }
}

function createGlobalDefs(): string {
  return 'declare var vscode = await import(\'vscode\');\n' +
    'declare module macros {\n' +
    '  export const macro: {\n' +
    '    /**\n' +
    '     * Id of current macro execution.\n' +
    '     */\n' +
    '    readonly runId: string;\n' +
    '    /**\n' +
    '     * URI of current macro. It can be undefined if running from an in-memory buffer.\n' +
    '     */\n' +
    '    readonly uri: vscode.Uri | undefined;\n' +
    '  }\n' +
    '}';
}

function createJSConfig(): string {
  return JSON.stringify({
    'compilerOptions': {
      'module': 'CommonJS',
      'target': 'ES2022',
    },
  }, undefined, 2);
}