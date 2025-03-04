import * as vscode from 'vscode';
import { createMacro } from './commands/createMacro';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { openMacro } from './commands/openMacro';
import { runActiveEditor, runMacro } from './commands/runMacro';
import { showRunningMacros } from './commands/showRunningMacros';
import { setContext } from './common/vscodeEx';
import { Manager } from './manager';
import { StatusBarItem } from './statusBarItem';

/**
 * Extension startup.
 * @param context Context.
*/
export async function activate(context: vscode.ExtensionContext) {
  let mruMacro: vscode.Uri | undefined;

  const manager = new Manager();
  context.subscriptions.push(
    manager,
    new StatusBarItem(manager),
    manager.onRun(({ macro: { uri } }) => setContext('mruSet', !!(mruMacro = uri)))
  );

  const r = vscode.commands.registerCommand;
  context.subscriptions.push(
    r('macros.debug', (pathOrUri?: string | vscode.Uri) => debugMacro(manager, pathOrUri)),
    r('macros.debug.activeEditor', () => debugActiveEditor(manager)),
    r('macros.new.macro', () => createMacro(context)),
    r('macros.open', () => openMacro()),
    r('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    r('macros.run.activeEditor', () => runActiveEditor(manager)),
    r('macros.run.mru', () => runMacro(manager, mruMacro)),
    r('macros.run.show', () => showRunningMacros(manager)),
    r('macros.sourceDirectories.settings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'macros.sourceDirectories')),
  );
}