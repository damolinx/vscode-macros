import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { PathLike, toUri } from '../utils/uri';

export async function deleteMacro(pathOrUriOrMacro: PathLike | Macro) {
  const uri = pathOrUriOrMacro instanceof Macro ? pathOrUriOrMacro.uri : toUri(pathOrUriOrMacro);

  try {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to delete macro: ${err instanceof Error ? err.message : err}`,
    );
  }
}
