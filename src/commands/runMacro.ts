import * as vscode from 'vscode';
import { resolveTokenizedPath } from '../core/pathTokenization';
import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { isUntitled, UriLocator, resolveUri } from '../utils/uri';
import { activeMacroEditor } from './utils';

export async function runMacro(
  { libraryManager, mruMacro, sandboxManager }: ExtensionContext,
  locatorOrTokenizedPath?: UriLocator | string,
  options?: { ignoreDiagnosticErrors?: true; startup?: true },
): Promise<void> {
  let uri: vscode.Uri | undefined;
  if (!locatorOrTokenizedPath) {
    uri = await showMacroQuickPick(libraryManager, { selectUri: mruMacro });
  } else if (typeof locatorOrTokenizedPath === 'string') {
    const resolvedPath = resolveTokenizedPath(locatorOrTokenizedPath);
    uri = vscode.Uri.file(resolvedPath[0]);
  } else {
    uri = resolveUri(locatorOrTokenizedPath);
  }

  if (!uri) {
    return; // Nothing to run.
  }

  const executor = await sandboxManager.ensureExecutor(uri);
  if (
    (!options?.ignoreDiagnosticErrors &&
      hasDiagnosticErrors(uri) &&
      !(await executor.macro.getCode()).options.singleton) ||
    executor.count === 0
  ) {
    const yesOption: vscode.MessageItem = { title: 'Run Anyway' };
    if (
      (await vscode.window.showWarningMessage(
        'This macro contains errors. Do you still want to run it?',
        { modal: true },
        yesOption,
        { title: 'Cancel', isCloseAffordance: true },
      )) !== yesOption
    ) {
      return; // User canceled
    }
  }

  const pareparedExecution = await executor.createDescriptor(options);

  try {
    await executor.executeDescriptor(pareparedExecution);
  } catch (error: any) {
    await showMacroErrorDialog(executor, pareparedExecution.snapshot, error ?? 'Unknown error');
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
