import * as vscode from 'vscode';
import { MacroRepl } from '../macroRepl';

export async function createMacroRepl(preserveFocus?: boolean): Promise<vscode.Terminal> {
  const terminal = await vscode.window.createTerminal({
    iconPath: new vscode.ThemeIcon('run-all'),
    name: 'macro',
    pty: new MacroRepl(),
  });
  terminal.show(preserveFocus);
  return terminal;
}