import * as vscode from 'vscode';
import { createMacro, updateActiveEditor } from './commands/createMacro';
import { createMacroRepl } from './commands/createMacroRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { openMacro } from './commands/openMacro';
import { resetSharedContext } from './commands/resetContext';
import { runActiveEditor, runMacro } from './commands/runMacro';
import { setupSourceDirectory } from './commands/setupSourceDirectory';
import { showRunningMacros } from './commands/showRunningMacros';
import { setContext } from './common/vscodeEx';
import { MACRO_EXTENSION, MACRO_LANGUAGE } from './constants';
import { MacroCodeLensProvider } from './language/macroCodeLensProvider';
import { MacroOptionsCompletionProvider, MACRO_TRIGGER_CHARACTERS } from './language/macroOptionsCompletionProvider';
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

  const { languages: l } = vscode;
  const selector: vscode.DocumentSelector = [
    { scheme: 'untitled', language: MACRO_LANGUAGE },
    { pattern: `**/*${MACRO_EXTENSION}` }
  ];
  context.subscriptions.push(
    l.registerCodeLensProvider(selector, new MacroCodeLensProvider()),
    l.registerCompletionItemProvider(selector, new MacroOptionsCompletionProvider(), ...MACRO_TRIGGER_CHARACTERS),
  );

  const { commands: c, commands: { registerCommand: cr } } = vscode;
  context.subscriptions.push(
    cr('macros.resetContext', (pathOrUri: string | vscode.Uri) => resetSharedContext(manager, pathOrUri)),
    cr('macros.debug', (pathOrUri?: string | vscode.Uri) => debugMacro(manager, pathOrUri)),
    cr('macros.debug.activeEditor', () => debugActiveEditor(manager)),
    cr('macros.new.macro', (content?: string) => createMacro(context, content)),
    cr('macros.new.macro.activeEditor', () => updateActiveEditor(context)),
    cr('macros.new.macro.repl', () => createMacroRepl(context)),
    cr('macros.open', () => openMacro()),
    cr('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    cr('macros.run.activeEditor', () => runActiveEditor(manager)),
    cr('macros.run.mru', () => runMacro(manager, mruMacro)),
    cr('macros.run.show', () => showRunningMacros(manager)),
    cr('macros.sourceDirectories.settings', () => c.executeCommand('workbench.action.openSettings', 'macros.sourceDirectories')),
    cr('macros.sourceDirectories.setup', () => setupSourceDirectory(context)),
  );
}