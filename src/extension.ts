import * as vscode from 'vscode';
import { createMacro } from './commands/createMacro';
import { runMacroFromSourceDirs } from './commands/runFromSourceDirs';
import { runMacro } from './commands/runMacro';
import { showRunningMacros } from './commands/showRunninMacros';
import { MACROS_FILTER } from './common/ui';
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
    vscode.commands.registerCommand('macros.new.macro', () => createMacro(context)),
    vscode.commands.registerCommand('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    vscode.commands.registerCommand('macros.run.activeEditor', async () => {
      const uri = await getActiveEditorUri();
      if (uri) {
        await runMacro(manager, uri);
      }
    }),
    vscode.commands.registerCommand('macros.run.fromSourceDirs', () => runMacroFromSourceDirs()),
    vscode.commands.registerCommand('macros.run.mru', () => runMacro(manager, mruMacro)),
    vscode.commands.registerCommand('macros.run.show', () => showRunningMacros(manager)),
  );
}

async function getActiveEditorUri(): Promise<vscode.Uri | undefined> {
  let uri: vscode.Uri | undefined;
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const { document } = editor;
    if (document.isUntitled) {
      uri = await saveUntitled(document);
    } else if (!document.isDirty || await document.save()) {
      uri = document.uri;
    }
  }

  return uri;

  async function saveUntitled(document: vscode.TextDocument) {
    const targetUri = await vscode.window.showSaveDialog({
      filters: MACROS_FILTER
    });

    if (targetUri) {
      await vscode.workspace.fs.writeFile(targetUri, Buffer.from(document.getText()));
      await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
      await vscode.window.showTextDocument(targetUri, { preview: false });
    }
    return targetUri;
  }
}

