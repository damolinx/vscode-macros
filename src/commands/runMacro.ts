import * as vscode from 'vscode';
import { selectMacroFile } from '../common/selectMacroFile';
import { Manager } from '../manager';
import { activeMacroEditor } from '../common/activeMacroEditor';

export async function runMacro(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : await selectMacroFile();

  if (!targetUri) {
    return; // Nothing to run.
  }

  await manager.run(targetUri);
}

export async function runActiveEditor(manager: Manager) {
  const editor = await activeMacroEditor(true);
  if (editor) {
    await runMacro(manager, editor.document.uri);
  }
}
