import { CodeMacro } from '../core/macros/code/codeMacro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';
import { ExtensionContext } from '../extensionContext';

export async function revealRelatedMacroInTree(
  { explorerTree }: ExtensionContext,
  startupMacro: StartupMacro,
): Promise<void> {
  const macroUri = getMacroUriFromStartupMacroUri(startupMacro.uri);
  const macro = new CodeMacro(macroUri);
  explorerTree.reveal(macro, { focus: true });
}
