import * as vscode from 'vscode';
import { MacroRunner } from '../core/execution/macroRunner';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { PathLike, toUri } from '../utils/uri';

export async function runMacro(
  { libraryManager, log, runnerManager, mruMacro }: ExtensionContext,
  pathOrUriOrMacro?: PathLike | Macro,
  startup?: true,
) {
  let runner: MacroRunner;
  if (pathOrUriOrMacro instanceof Macro) {
    runner = runnerManager.getRunner(pathOrUriOrMacro);
  } else {
    const uri = pathOrUriOrMacro
      ? toUri(pathOrUriOrMacro)
      : await showMacroQuickPick(libraryManager, { selectUri: mruMacro });
    if (!uri) {
      return; // Nothing to run.
    }
    runner = runnerManager.getRunner(uri);
  }

  const [code, options] = await runner.getMacroCode();
  if (code.length === 0) {
    log.warn(
      'Skipped running macro file: file is empty.',
      `"${vscode.workspace.asRelativePath(runner.macro.uri, true)}"`,
    );
    return;
  }

  try {
    await runner.run(code, options, startup);
  } catch (error) {
    await showMacroErrorDialog(runner, options, error as Error | string);
  }
}

export async function runActiveEditor(context: ExtensionContext) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
