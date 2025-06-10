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
import { MACRO_EXTENSION, MACRO_LANGUAGE } from './core/constants';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibraryManager';
import { ExtensionContext } from './extensionContext';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { DTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { EXECUTE_COMMAND_CHARACTERS, ExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { MacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { MACRO_TRIGGER_CHARACTERS, MacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
import { PathLike } from './utils/uri';

/**
 * Extension startup.
 * @param extensionContext Context.
*/
export async function activate(extensionContext: vscode.ExtensionContext) {
  const context = new ExtensionContext(extensionContext);
  extensionContext.subscriptions.push(
    context,
    new MacroStatusBarItem(context),
  );

  const { languages: l } = vscode;
  const selector: vscode.DocumentSelector = [
    { scheme: 'untitled', language: MACRO_LANGUAGE },
    { pattern: `**/*${MACRO_EXTENSION}` },
  ];
  const executeCommandCompletionProvider = new ExecuteCommandCompletionProvider();
  extensionContext.subscriptions.push(
    l.registerCodeActionsProvider(selector, new DTSCodeActionProvider()),
    executeCommandCompletionProvider,
    l.registerCompletionItemProvider(selector, executeCommandCompletionProvider, ...EXECUTE_COMMAND_CHARACTERS),
    l.registerCodeLensProvider(selector, new MacroCodeLensProvider()),
    l.registerCompletionItemProvider(selector, new MacroOptionsCompletionProvider(), ...MACRO_TRIGGER_CHARACTERS),
  );

  const { lm } = vscode;
  extensionContext.subscriptions.push(
    new MacroChatParticipant(context),
    lm.registerTool(CREATE_MACRO_TOOL_ID, new MacroCreateTool(context)),
  );

  const { commands: c, commands: { registerCommand: cr } } = vscode;
  extensionContext.subscriptions.push(
    cr('macros.resetContext', (pathOrUri: PathLike) => resetSharedContext(context, pathOrUri)),
    cr('macros.debug', (pathOrUri?: PathLike) => debugMacro(pathOrUri)),
    cr('macros.debug.activeEditor', () => debugActiveEditor()),
    cr('macros.downloadAsset', (assetUri: vscode.Uri, macroPathOrUri: PathLike) => downloadAsset(assetUri, macroPathOrUri)),
    cr('macros.new.macro', (content?: string) => createMacro(context, content)),
    cr('macros.new.macro.activeEditor', () => updateActiveEditor(context)),
    cr('macros.new.macro.repl', () => createRepl(context)),
    cr('macros.open', () => openMacro(context)),
    cr('macros.run', (pathOrUri?: PathLike) => runMacro(context, pathOrUri)),
    cr('macros.run.activeEditor', () => runActiveEditor(context)),
    cr('macros.run.mru', () => runMacro(context, context.mruMacro)),
    cr('macros.run.show', () => showRunningMacros(context)),
    cr('macros.sourceDirectories.settings', () => c.executeCommand('workbench.action.openSettings', SOURCE_DIRS_CONFIG)),
    cr('macros.sourceDirectories.setup', () => setupSourceDirectory(context)),
  );
}