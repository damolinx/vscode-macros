import * as vscode from 'vscode';
import { basename, dirname } from 'path';
import { activeMacroEditor } from '../common/activeMacroEditor';
import { showMacroOpenDialog } from '../common/ui';
import { showTextDocument, UriHelpers } from '../common/vscodeEx';
import { Manager } from '../manager';

export async function debugMacro(_manager: Manager, pathOrUri?: string | vscode.Uri) {
  const uri = pathOrUri ? UriHelpers.toUri(pathOrUri) : await showMacroOpenDialog();
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
      `--extensionDevelopmentPath=${dirname(document.uri.fsPath)}`
    ],
    env: { MACROS_EXT_DEBUG: '1' }
  };
  vscode.debug.startDebugging(undefined, debugConfig);
}

export async function debugActiveEditor(manager: Manager) {
  const editor = await activeMacroEditor(true);
  if (editor) {
    await debugMacro(manager, editor.document.uri);
  }
}