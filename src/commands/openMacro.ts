import { showMacroQuickPick } from '../ui/dialogs';
import { PathLike, toUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export async function openMacro(pathOrUri?: PathLike) {
  const uri = pathOrUri ? toUri(pathOrUri) : await showMacroQuickPick({ hideOpenPerItem: true });
  if (!uri) {
    return; // Nothing to run.
  }

  await showTextDocument(uri);
}