import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { fromLocator, isUntitled, Locator, toUri } from '../utils/uri';

export async function runMacro(
  { libraryManager, mruMacro, runnerManager }: ExtensionContext,
  locator?: Locator,
  options?: { ignoreDiagnosticErrors?: true; startup?: true },
) {
  const uri = locator
    ? toUri(fromLocator(locator))
    : await showMacroQuickPick(libraryManager, { selectUri: mruMacro });
  if (!uri) {
    return; // Nothing to run.
  }

  const yesOption: vscode.MessageItem = { title: 'Run Anyway' };
  if (
    !options?.ignoreDiagnosticErrors &&
    hasDiagnosticErrors(uri) &&
    (await vscode.window.showWarningMessage(
      'This macro contains errors. Do you still want to run it?',
      { modal: true },
      yesOption,
      { title: 'Cancel', isCloseAffordance: true },
    )) !== yesOption
  ) {
    return; // User canceled
  }

  const runner = runnerManager.getRunner(uri);
  const macroCode = await runner.macro.getCode();

  try {
    await runner.run(macroCode, options?.startup);
  } catch (error: any) {
    await showMacroErrorDialog(runner, macroCode, error as Error | string);
  }

  function hasDiagnosticErrors(uri: vscode.Uri) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    return isUntitled(uri)
      ? diagnostics.some(
          (d) =>
            d.severity === vscode.DiagnosticSeverity.Error &&
            (d.source !== 'ts' || (d.code !== 2304 && d.code !== 2307)),
        )
      : diagnostics.some((d) => d.severity === vscode.DiagnosticSeverity.Error);
  }
}

export async function runActiveEditor(context: ExtensionContext) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
