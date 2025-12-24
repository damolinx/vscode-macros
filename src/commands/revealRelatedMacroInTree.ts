import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { explorerTreeView } from '../views/treeViews';

export async function revealRelatedMacroInTree(startupMacro: StartupMacro): Promise<void> {
  const macroUri = getMacroUriFromStartupMacroUri(startupMacro.uri);
  const macro = new Macro(macroUri);
  explorerTreeView?.reveal(macro, { focus: true });
}
