import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { asWorkspaceRelativePath, fromLocator, Locator, toUri } from '../utils/uri';

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

  const runner = runnerManager.getRunner(uri);
  const macroCode = await runner.macro.getCode();

  try {
    const code = macroCode.getRunnableCode();
    log.info('Executing macro', asWorkspaceRelativePath(uri));
    await runner.run(code, macroCode.options, startup);
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
