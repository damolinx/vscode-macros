import * as vscode from 'vscode';
import { showMacroOpenDialog } from '../common/ui';
import { Manager } from '../manager';

export async function runMacro(manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : await showMacroOpenDialog();

  if (!targetUri) {
    return; // Nothing to run.
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
