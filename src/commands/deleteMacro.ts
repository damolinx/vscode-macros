import * as vscode from 'vscode';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function deleteMacro(locator: Locator) {
  const uri = toUri(fromLocator(locator));

  try {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to delete macro: ${err instanceof Error ? err.message : err}`,
    );
  }
}
