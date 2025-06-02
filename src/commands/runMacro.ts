import { MacroRunnerManager } from '../core/execution/macroRunnerManager';
import { showMacroErrorDialog, showMacroQuickPick } from '../ui/dialogs';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { PathLike, toUri } from '../utils/uri';
import { expandTokens } from '../utils/variables';

export async function runMacro(manager: MacroRunnerManager, pathOrUri?: PathLike) {
  const uri = pathOrUri ? toUri(expandTokens(pathOrUri)) : await showMacroQuickPick();
  if (!uri) {
    return; // Nothing to run.
  }

  const runner = manager.getRunner(uri);
  try {
    await runner.run();
  } catch (error) {
    const options = await runner.macro.getOptions();
    await showMacroErrorDialog(runner, options, error as Error | string);
  }
}

export async function runActiveEditor(manager: MacroRunnerManager) {
  const editor = await activeMacroEditor(false);
  if (editor) {
    await runMacro(manager, editor.document.uri);
  }
}
