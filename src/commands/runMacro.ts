import { ExtensionContext } from '../extensionContext';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { PathLike, toUri } from '../utils/uri';

export async function runMacro(context: ExtensionContext, pathOrUri?: PathLike) {
  const uri = pathOrUri
    ? toUri(pathOrUri)
    : await showMacroQuickPick(context.libraryManager, { selectUri: context.mruMacro });
  if (!uri) {
    return; // Nothing to run.
  }

  const runner = context.runnerManager.getRunner(uri);
  try {
    await runner.run();
  } catch (error) {
    const options = await runner.macro.getOptions();
    await showMacroErrorDialog(runner, options, error as Error | string);
  }
}

export async function runActiveEditor(context: ExtensionContext) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(context, editor.document.uri);
  }
}
