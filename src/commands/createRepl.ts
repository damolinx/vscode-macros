import * as vscode from 'vscode';
import { MacroPseudoterminal } from '../macroPseudoterminal';

export async function createRepl(context: vscode.ExtensionContext, preserveFocus?: boolean): Promise<vscode.Terminal> {
  const pty = new MacroPseudoterminal(context, 'macro-repl');
  const terminal = await vscode.window.createTerminal({
    iconPath: new vscode.ThemeIcon('run-all'),
    name: 'macro',
    pty,
  });
  pty.onDidClose(() => terminal.dispose());

  terminal.show(preserveFocus);
  return terminal;
}