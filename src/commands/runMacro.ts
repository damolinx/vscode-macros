import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function runMacro(
  { libraryManager, log, mruMacro, runnerManager }: ExtensionContext,
  locator?: Locator,
  startup?: true,
) {
  const uri = locator
    ? toUri(fromLocator(locator))
    : await showMacroQuickPick(libraryManager, { selectUri: mruMacro });
  if (!uri) {
    return; // Nothing to run.
  }

  const yesOption: vscode.MessageItem = { title: 'Run Anyway' };
  if (
    vscode.languages
      .getDiagnostics(uri)
      .some((d) => d.severity === vscode.DiagnosticSeverity.Error) &&
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
    log.info('Executing macro', vscode.workspace.asRelativePath(uri));
    await runner.run(macroCode, startup);
  } catch (error: any) {
    await showMacroErrorDialog(runner, macroCode, error as Error | string);
  }
}

export async function runActiveEditor(context: ExtensionContext) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
