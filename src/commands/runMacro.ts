import * as vscode from 'vscode';
import { Manager } from '../manager';

export async function runMacro(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : (await vscode.window.showOpenDialog({
      filters: {
        'Macro Files': ['js'],
      },
    }))?.pop();

  if (!targetUri) {
    return; // Nothing to run.
  }

  try {
    await manager.run(targetUri);
  } catch (reason) {
    vscode.window.showErrorMessage((<any>reason).toString());
  }
}
