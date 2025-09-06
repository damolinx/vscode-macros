import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { MacroPseudoterminal } from '../macroPseudoterminal';
import { MacrosDarkIcon, MacrosLightIcon } from '../ui/icons';

export async function createRepl(
  context: ExtensionContext,
  preserveFocus?: boolean,
): Promise<vscode.Terminal> {
  const pty = new MacroPseudoterminal(context, 'macro-repl');
  const terminal = await vscode.window.createTerminal({
    iconPath: {
      light: MacrosLightIcon.get(context),
      dark: MacrosDarkIcon.get(context),
    },
    name: 'macro',
    pty,
  });
  pty.onDidClose(() => terminal.dispose());

  terminal.show(preserveFocus);
  return terminal;
}
