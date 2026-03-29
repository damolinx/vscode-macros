import { Macro } from '../core/macro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';

export async function revealRelatedMacroInTree(
  { explorerTree }: ExtensionContext,
  startupMacro: StartupMacro,
): Promise<void> {
  const macroUri = getMacroUriFromStartupMacroUri(startupMacro.uri);
  const macro = new Macro(macroUri);
  explorerTree.reveal(macro, { focus: true });
}
