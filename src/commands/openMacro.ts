import * as vscode from 'vscode';
import { selectMacroFile } from '../common/selectMacroFile';
import { showTextDocument, UriHelpers } from '../common/vscodeEx';

export async function openMacro(pathOrUri?: string | vscode.Uri) {
  const uri = pathOrUri ? UriHelpers.toUri(pathOrUri) : await selectMacroFile({ hideOpenPerItem: true });
  if (!uri) {
    return; // Nothing to run.
  }

  await showTextDocument(uri);
}