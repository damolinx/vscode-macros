import * as vscode from 'vscode';
import { Manager } from '../manager';

export async function runRecent(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : vscode.window.activeTextEditor?.document.uri;
  if (!targetUri) {
    vscode.window.showErrorMessage('No macro file to run was provided.');
    return;
  }

  try {
    await manager.run(targetUri);
  } catch (reason) {
    if (reason instanceof Error) {
      vscode.window.showErrorMessage(reason.message);
    } else {
      vscode.window.showErrorMessage(String(reason));
    }
  }
}
