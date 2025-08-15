import { ExtensionContext } from '../extensionContext';
import { showMacroQuickPick } from '../ui/dialogs';
import { PathLike, toUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export async function openMacro({ libraryManager }: ExtensionContext, pathOrUri?: PathLike) {
  const uri = pathOrUri
    ? toUri(pathOrUri)
    : await showMacroQuickPick(libraryManager, { hideOpenPerItem: true });
  if (!uri) {
    return; // Nothing to run.
  }

  await showTextDocument(uri);
}
