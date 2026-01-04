import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { showMacroQuickPick } from '../ui/dialogs';
import { UriLocator, parentUri, uriBasename, resolveUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';
import { activeMacroEditor } from './utils';

export const MACROS_EXT_DEBUG_VAR = 'MACROS_EXT_DEBUG';

export async function debugMacro(
  { libraryManager, mruMacro }: ExtensionContext,
  locator?: UriLocator,
): Promise<boolean | undefined> {
  const uri = locator
    ? resolveUri(locator)
    : await showMacroQuickPick(libraryManager, { selectUri: mruMacro });
  if (!uri) {
    return; // Nothing to debug.
  }

  if (uri.scheme !== 'file') {
    await vscode.window.showErrorMessage('Debugging of non-local macros is not supported.', {
      modal: true,
      detail: 'Save your macro to a local library for debugging',
    });
    return;
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
    args: [`--extensionDevelopmentPath=${parentUri(document.uri).fsPath}`],
    env: { [MACROS_EXT_DEBUG_VAR]: '1' },
  };

  const started = await vscode.debug.startDebugging(undefined, debugConfig);
  return started;
}

export async function debugActiveEditor(context: ExtensionContext): Promise<boolean | undefined> {
  let started: boolean | undefined;
  const editor = await activeMacroEditor(true);
  if (editor) {
    started = await debugMacro(context, editor.document.uri);
  }
  return started;
}
