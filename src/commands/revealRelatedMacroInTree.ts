import { Context } from '../context';
import { CodeMacro } from '../core/macros/code/codeMacro';
import { StartupMacro } from '../core/startupMacro';
import { getMacroUriFromStartupMacroUri } from '../core/startupMacroId';

export async function revealRelatedMacroInTree(
  { explorerTree }: Context,
  startupMacro: StartupMacro,
): Promise<void> {
  const macroUri = getMacroUriFromStartupMacroUri(startupMacro.uri);
  const macro = new CodeMacro(macroUri);
  explorerTree.reveal(macro, { focus: true });
}
