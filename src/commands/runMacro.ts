import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function runMacro(
  { libraryManager, runnerManager, mruMacro }: ExtensionContext,
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
  const { code, options } = await runner.macro.getCode();

  try {
    await runner.run(code, options, startup);
  } catch (error: any) {
    await showMacroErrorDialog(runner, options, error as Error | string);
  }
}

export async function runActiveEditor(context: ExtensionContext) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
