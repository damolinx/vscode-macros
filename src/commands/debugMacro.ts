import * as vscode from 'vscode';
import { basename, dirname } from 'path';
import { showMacroOpenDialog } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { showTextDocument } from '../utils/vscodeEx';
import { PathLike, toUri } from '../utils/uri';

export async function debugMacro(pathOrUri?: PathLike) {
  const uri = pathOrUri ? toUri(pathOrUri) : await showMacroOpenDialog();
  if (!uri) {
    return; // Nothing to run.
  }

  // Ensure the document is open, update URI
  const { document } = await showTextDocument(uri);

  // Check for existing breakpoints in the document
  if (vscode.workspace.getConfiguration().get('macros.debug.breakOnStart', true)) {
    const hasBreakpoints = vscode.debug.breakpoints
      .filter(bp => bp instanceof vscode.SourceBreakpoint)
      .some(bp => bp.location.uri.fsPath === document.uri.fsPath);

    if (!hasBreakpoints) {
      const breakpoint = new vscode.SourceBreakpoint(
        new vscode.Location(document.uri, new vscode.Position(0, 0)));
      vscode.debug.addBreakpoints([breakpoint]);
    }
  }

  // Launch VS Code
  const debugConfig: vscode.DebugConfiguration = {
    name: `Debug Macro: ${basename(document.uri.fsPath)}`,
    type: 'extensionHost',
    request: 'launch',
    args: [
      `--extensionDevelopmentPath=${dirname(document.uri.fsPath)}`,
    ],
    env: { MACROS_EXT_DEBUG: '1' },
  };
  vscode.debug.startDebugging(undefined, debugConfig);
}

export async function debugActiveEditor() {
  const editor = await activeMacroEditor(true);
  if (editor) {
    await debugMacro(editor.document.uri);
  }
}