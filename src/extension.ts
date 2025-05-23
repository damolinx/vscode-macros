import * as vscode from 'vscode';
import { MacroChatParticipant } from './ai/macroChatParticipant';
import { CREATE_MACRO_TOOL_ID, MacroCreateTool } from './ai/macroCreateTool';
import { createMacro, updateActiveEditor } from './commands/createMacro';
import { createRepl } from './commands/createRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { downloadAsset } from './commands/downloadAsset';
import { openMacro } from './commands/openMacro';
import { resetSharedContext } from './commands/resetContext';
import { runActiveEditor, runMacro } from './commands/runMacro';
import { setupSourceDirectory } from './commands/setupSourceDirectory';
import { showRunningMacros } from './commands/showRunningMacros';
import { setContext } from './common/vscodeEx';
import { MACRO_EXTENSION, MACRO_LANGUAGE } from './constants';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { Manager } from './manager';
import { DTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { EXECUTE_COMMAND_CHARACTERS, ExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { MacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { MACRO_TRIGGER_CHARACTERS, MacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';

/**
 * Extension startup.
 * @param context Context.
*/
export async function activate(context: vscode.ExtensionContext) {
  let mruMacro: vscode.Uri | undefined;

  const manager = new Manager();
  context.subscriptions.push(
    manager,
    new MacroStatusBarItem(manager),
    manager.onRun(({ macro: { uri } }) => setContext('mruSet', !!(mruMacro = uri))),
  );

  const { languages: l } = vscode;
  const selector: vscode.DocumentSelector = [
    { scheme: 'untitled', language: MACRO_LANGUAGE },
    { pattern: `**/*${MACRO_EXTENSION}` },
  ];
  const executeCommandCompletionProvider = new ExecuteCommandCompletionProvider();
  context.subscriptions.push(
    l.registerCodeActionsProvider(selector, new DTSCodeActionProvider()),
    executeCommandCompletionProvider,
    l.registerCompletionItemProvider(selector, executeCommandCompletionProvider, ...EXECUTE_COMMAND_CHARACTERS),
    l.registerCodeLensProvider(selector, new MacroCodeLensProvider()),
    l.registerCompletionItemProvider(selector, new MacroOptionsCompletionProvider(), ...MACRO_TRIGGER_CHARACTERS),
  );

  const { lm } = vscode;
  context.subscriptions.push(
    new MacroChatParticipant(context),
    lm.registerTool(CREATE_MACRO_TOOL_ID, new MacroCreateTool(context)),
  );

  const { commands: c, commands: { registerCommand: cr } } = vscode;
  context.subscriptions.push(
    cr('macros.resetContext', (pathOrUri: string | vscode.Uri) => resetSharedContext(manager, pathOrUri)),
    cr('macros.debug', (pathOrUri?: string | vscode.Uri) => debugMacro(manager, pathOrUri)),
    cr('macros.debug.activeEditor', () => debugActiveEditor(manager)),
    cr('macros.downloadAsset', (url: string, macroFile: vscode.Uri) => downloadAsset(url, macroFile)),
    cr('macros.new.macro', (content?: string) => createMacro(context, content)),
    cr('macros.new.macro.activeEditor', () => updateActiveEditor(context)),
    cr('macros.new.macro.repl', () => createRepl(context)),
    cr('macros.open', () => openMacro()),
    cr('macros.run', (pathOrUri?: string | vscode.Uri) => runMacro(manager, pathOrUri)),
    cr('macros.run.activeEditor', () => runActiveEditor(manager)),
    cr('macros.run.mru', () => runMacro(manager, mruMacro)),
    cr('macros.run.show', () => showRunningMacros(manager)),
    cr('macros.sourceDirectories.settings', () => c.executeCommand('workbench.action.openSettings', 'macros.sourceDirectories')),
    cr('macros.sourceDirectories.setup', () => setupSourceDirectory(context)),
  );
}