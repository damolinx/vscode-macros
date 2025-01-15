import * as vscode from 'vscode';
import { Manager } from './manager';
import { runMacroFromSourceDirs } from './commands/runFromSourceDirs';
import { runMacro } from './commands/runMacro';
import { showRunningMacros } from './commands/showRunninMacros';
import { StatusBarTracker } from './statusBarTracker';

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

  context.subscriptions.push(
    manager,
    new StatusBarTracker(manager),
    vscode.commands.registerCommand('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => runMacro(manager, await getActiveEditorUri())),
    vscode.commands.registerCommand('macros.run.fromSourceDirs', () => runMacroFromSourceDirs()),
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

