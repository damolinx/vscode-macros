import * as vscode from 'vscode';
import { createMacro } from './commands/createMacro';
import { debugMacro } from './commands/debugMacro';
import { getActiveMacroEditorUri } from './commands/getActiveMacroEditorUri';
import { runMacro } from './commands/runMacro';
import { selectMacroFile } from './commands/selectMacroFile';
import { showRunningMacros } from './commands/showRunningMacros';
import { openDocument } from './common/ui';
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
    vscode.commands.registerCommand('macros.debug', (pathOrUri?: string | vscode.Uri) =>
      debugMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.debug.activeEditor', async () => {
      const uri = await getActiveMacroEditorUri();
      if (uri) {
        await debugMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.open', async () => {
      const uri = await selectMacroFile();
      if (uri) {
        await openDocument(uri);
      }
    }),
    vscode.commands.registerCommand('macros.new.macro', () =>
      createMacro(context)),
    vscode.commands.registerCommand('macros.run', (pathOrUri?: string | vscode.Uri) =>
      runMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => {
      const uri = await getActiveMacroEditorUri();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.mru', () =>
      runMacro(manager, mruMacro)),
    vscode.commands.registerCommand('macros.run.show', () =>
      showRunningMacros(manager)),
  );
}

