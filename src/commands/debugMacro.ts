import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { showMacroOpenDialog } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { PathLike, toUri, uriBasename, uriDirname } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export async function debugMacro(pathOrUriOrMacro?: PathLike | Macro) {
  let uri: vscode.Uri | undefined;

  if (!pathOrUriOrMacro) {
    uri = await showMacroOpenDialog();
    if (!uri) {
      return; // Nothing to run.
    }
  } else if (pathOrUriOrMacro instanceof Macro) {
    uri = pathOrUriOrMacro.uri;
  } else {
    uri = toUri(pathOrUriOrMacro);
  }

  // Ensure the document is open, update URI
  const { document } = await showTextDocument(uri);

  // Check for existing breakpoints in the document
  if (vscode.workspace.getConfiguration().get('macros.debug.breakOnStart', true)) {
    const hasBreakpoints = vscode.debug.breakpoints
      .filter((bp) => bp instanceof vscode.SourceBreakpoint)
      .some((bp) => bp.location.uri.fsPath === document.uri.fsPath);

    if (!hasBreakpoints) {
      const breakpoint = new vscode.SourceBreakpoint(
        new vscode.Location(document.uri, new vscode.Position(0, 0)),
      );
      vscode.debug.addBreakpoints([breakpoint]);
    }
  }

  // Launch VS Code
  const debugConfig: vscode.DebugConfiguration = {
    name: `Debug Macro: ${uriBasename(document.uri)}`,
    type: 'extensionHost',
    request: 'launch',
    args: [`--extensionDevelopmentPath=${uriDirname(document.uri)}`],
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
