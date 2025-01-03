import * as vscode from 'vscode';
import { Manager } from './manager';
import { runMacro } from './commands/runMacro';
import { showRunningMacros } from './commands/showRunninMacros';

/**
 * Extension startup.
 * @param context Context.
 */
export async function activate(context: vscode.ExtensionContext) {
  const manager = new Manager();
  context.subscriptions.push(
    manager,
    vscode.commands.registerCommand('macros.run', () => runMacro(manager)),
    vscode.commands.registerCommand('macros.run.show', () => showRunningMacros(manager)),
  );
}
