import * as vscode from 'vscode';
import { createMacro } from './commands/createMacro';
import { debugMacro } from './commands/debugMacro';
import { getActiveMacroEditor } from './commands/getActiveMacroEditor';
import { runMacro } from './commands/runMacro';
import { selectMacroFile } from './commands/selectMacroFile';
import { showRunningMacros } from './commands/showRunningMacros';
import { Manager } from './manager';
import { StatusBarItem } from './statusBarItem';

/**
 * Extension startup.
 * @param context Context.
*/
export async function activate(context: vscode.ExtensionContext) {
  let mruMacro: vscode.Uri | undefined;

  const manager = new Manager();
  manager.onRun(async (runInfo) => {
    mruMacro = runInfo.macro.uri;
    await vscode.commands.executeCommand('setContext', 'macros:mruSet', true);
  });

  context.subscriptions.push(
    manager,
    new StatusBarItem(manager),
    vscode.commands.registerCommand('macros.debug', async () => {
      const uri = await selectMacroFile();
      if (uri) {
        await debugMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.debug.activeEditor', async () => {
      const uri = await getActiveMacroEditor();
      if (uri) {
        await debugMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.new.macro', () => createMacro(context)),
    vscode.commands.registerCommand('macros.run', async () => {
      const uri = await selectMacroFile();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => {
      const uri = await getActiveMacroEditor();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.mru', () => runMacro(manager, mruMacro)),
    vscode.commands.registerCommand('macros.run.show', () => showRunningMacros(manager)),
  );
}

