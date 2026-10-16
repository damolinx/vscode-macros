import * as vscode from 'vscode';
import { Context } from '../context';
import { getExecutionId } from '../core/execution/executionId';
import { MacroReplTerminal } from '../repl/macroReplTerminal';
import { MacrosDarkIconUri, MacrosLightIconUri } from '../ui/icons';

let replIndex = 1;

export async function createRepl(
  context: Context,
  preserveFocus?: boolean,
): Promise<vscode.Terminal> {
  const pty = new MacroReplTerminal(context, getExecutionId('macro-repl', replIndex++));
  const terminal = vscode.window.createTerminal({
    iconPath: {
      light: MacrosLightIconUri.get(context),
      dark: MacrosDarkIconUri.get(context),
    },
    name: 'macro',
    pty,
  });
  pty.onDidClose(() => terminal.dispose());

  terminal.show(preserveFocus);
  return terminal;
}
