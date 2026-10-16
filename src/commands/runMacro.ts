import * as vscode from 'vscode';
import { Context } from '../context';
import { SingletonMacroAlreadyRunningError } from '../core/execution/executors/errors';
import { showMacroQuickPick } from '../ui/dialogs';
import { showMacroErrorMessage } from '../ui/errors';
import { isUntitled, UriLocator, resolveUri } from '../utils/uri';
import { activeMacroEditor } from './utils';

export async function runMacro(
  context: Context,
  locator?: UriLocator,
  options?: { ignoreDiagnosticErrors?: true; startup?: true },
): Promise<void> {
  const uri = locator
    ? resolveUri(locator)
    : await showMacroQuickPick(context.libraryManager, {
        activeUri: context.mruMacro,
        placeHolder: 'Select a macro to run',
      });
  if (!uri) {
    return;
  }

  if (!options?.ignoreDiagnosticErrors && hasDiagnosticErrors(uri)) {
    const yesOption: vscode.MessageItem = { title: 'Run Anyway' };
    if (
      (await vscode.window.showWarningMessage(
        'This macro contains errors. Do you still want to run it?',
        { modal: true },
        yesOption,
        { title: 'Cancel', isCloseAffordance: true },
      )) !== yesOption
    ) {
      return;
    }
  }

  const executor = await context.executorManager.ensureExecutor(uri);
  try {
    await executor.execute(options, (error, { snapshot }) =>
      showMacroErrorMessage(executor, snapshot, error),
    );
  } catch (error) {
    if (error instanceof SingletonMacroAlreadyRunningError) {
      vscode.window.setStatusBarMessage(
        `$(warning) Singleton macro '${error.macroName}' is already running`,
        5000,
      );
      return;
    }
    throw error;
  }
}

function hasDiagnosticErrors(uri: vscode.Uri) {
  const diagnostics = vscode.languages.getDiagnostics(uri);

  if (isUntitled(uri)) {
    return diagnostics.some(
      (d) =>
        d.severity === vscode.DiagnosticSeverity.Error &&
        (d.source !== 'ts' || (d.code !== 2304 && d.code !== 2307)),
    );
  }

  return diagnostics.some(({ severity }) => severity === vscode.DiagnosticSeverity.Error);
}

export async function runActiveEditor(context: Context) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
