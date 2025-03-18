import * as vscode from 'vscode';
import { MacroTerminal } from '../macroTerminal';

export async function createMacroRepl(preserveFocus?: boolean): Promise<vscode.Terminal> {
  const terminal = await vscode.window.createTerminal({
    iconPath: new vscode.ThemeIcon('run-all'),
    name: 'macro',
    pty: new MacroTerminal(),
  });
  terminal.show(preserveFocus);
  return terminal;
}