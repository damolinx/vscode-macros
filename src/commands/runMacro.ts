import * as vscode from 'vscode';
import { selectMacroFile } from './selectMacroFile';
import { Manager } from '../manager';

export async function runMacro(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : await selectMacroFile();

  if (!targetUri) {
    return; // Nothing to run.
  }

  await manager.run(targetUri);
}
