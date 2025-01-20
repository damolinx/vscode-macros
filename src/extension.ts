import * as vscode from 'vscode';
import { createMacro } from './commands/createMacro';
import { debugMacro } from './commands/debugMacro';
import { getActiveEditorUri } from './commands/getActiveEditorUri';
import { getMacroFromSourceDirs } from './commands/getMacroFromSourceDirs';
import { runMacro } from './commands/runMacro';
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
    vscode.commands.registerCommand('macros.debug', (pathOrUri?: string | vscode.Uri) => debugMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.debug.activeEditor', async () => {
      const uri = await getActiveEditorUri();
      if (uri) {
        await debugMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.debug.fromSourceDirs', async () => {
      const uri = await getMacroFromSourceDirs();
      if (uri) {
        await debugMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.new.macro', () => createMacro(context)),
    vscode.commands.registerCommand('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => {
      const uri = await getActiveEditorUri();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.fromSourceDirs', async () => {
      const uri = await getMacroFromSourceDirs();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.mru', () => runMacro(manager, mruMacro)),
    vscode.commands.registerCommand('macros.run.show', () => showRunningMacros(manager)),
  );
}

