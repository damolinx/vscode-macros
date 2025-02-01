import * as vscode from 'vscode';
import { activeMacroEditor } from '../common/activeMacroEditor';
import { selectMacroFile } from '../common/selectMacroFile';
import { UriHelpers } from '../common/vscodeEx';
import { Manager } from '../manager';

export async function runMacro(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const uri = pathOrUri ? UriHelpers.toUri(pathOrUri) : await selectMacroFile();
  if (!uri) {
    return; // Nothing to run.
  }

  await manager.run(uri);
}

export async function runActiveEditor(manager: Manager) {
  const editor = await activeMacroEditor(true);
  if (editor) {
    await runMacro(manager, editor.document.uri);
  }
}
