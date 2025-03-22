import * as vscode from 'vscode';
import { MacroTerminal } from '../macroTerminal';

let id = 0;

export async function createMacroRepl(context: vscode.ExtensionContext, preserveFocus?: boolean): Promise<vscode.Terminal> {
  const macroTerminal = new MacroTerminal(context, `macro${++id}`);
  const terminal = await vscode.window.createTerminal({
    iconPath: new vscode.ThemeIcon('run-all'),
    name: 'macro',
    pty: macroTerminal,
  });
  macroTerminal.onDidClose(() => terminal.dispose());

  terminal.show(preserveFocus);
  return terminal;
}