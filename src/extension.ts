import * as vscode from 'vscode';
import { Manager } from './manager';
import { runMacro } from './commands/runMacro';
import { showRunningMacros } from './commands/showRunninMacros';
import { StatusBarItem } from './statusBarItem';

let mruMacro: vscode.Uri | undefined;

/**
 * Extension startup.
 * @param context Context.
 */
export async function activate(context: vscode.ExtensionContext) {
  const manager = new Manager();
  manager.onRun(async (runInfo) => {
    mruMacro = runInfo.macro.uri;
    await vscode.commands.executeCommand('setContext', 'macros:mruSet', true);
  });

  // Store a value in global state


  context.subscriptions.push(
    manager,
    new StatusBarItem(manager),
    vscode.commands.registerCommand('macros.run', () => runMacro(manager)),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => runMacro(manager, await getActiveEditorUri())),
    vscode.commands.registerCommand('macros.run.mru', () => runMacro(manager, mruMacro)),
    vscode.commands.registerCommand('macros.run.show', () => showRunningMacros(manager)),
  );
}

async function getActiveEditorUri(): Promise<vscode.Uri | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    await editor.document.save();
    return editor.document.uri;
  }

  return undefined;
}

