import * as vscode from 'vscode';
import { basename, dirname } from 'path';
import { openDocument, showMacroOpenDialog } from '../common/ui';
import { Manager } from '../manager';

export async function debugMacro(_manager: Manager, pathOrUri?: string | vscode.Uri) {
  const targetUri = pathOrUri
    ? (pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri))
    : await showMacroOpenDialog();

  if (!targetUri) {
    return; // Nothing to run.
  }

  // Ensure the document is open
  const { document } = await openDocument(targetUri);

  // Check for existing breakpoints in the document
  if (vscode.workspace.getConfiguration().get('macros.debug.breakOnStart', true)) {
    const hasBreakpoints = vscode.debug.breakpoints.some(bp =>
      (bp instanceof vscode.SourceBreakpoint) && bp.location.uri.fsPath === document.uri.fsPath);

    if (!hasBreakpoints) {
      const breakpoint = new vscode.SourceBreakpoint(new vscode.Location(document.uri, new vscode.Position(0, 0)));
      vscode.debug.addBreakpoints([breakpoint]);
    }
  }

  // Launch VS Code 
  const debugConfig: vscode.DebugConfiguration = {
    name: `Debug Macro: ${basename(targetUri.fsPath)}`,
    type: 'extensionHost',
    request: 'launch',
    args: [
      `--extensionDevelopmentPath=${dirname(targetUri.fsPath)}`
    ],
    env: { MACROS_EXT_DEBUG: '1' }
  };
  vscode.debug.startDebugging(undefined, debugConfig);
}
