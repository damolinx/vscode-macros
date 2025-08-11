import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { registerMacroChatParticipant } from './ai/macroChatParticipant';
import { registerMacroCreateLanguageModelTool } from './ai/macroCreateTool';
import { createMacro, updateActiveEditor } from './commands/createMacro';
import { createRepl } from './commands/createRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { downloadAsset } from './commands/downloadAsset';
import { openMacro } from './commands/openMacro';
import { resetSharedContext } from './commands/resetContext';
import { runActiveEditor, runMacro } from './commands/runMacro';
import { setupSourceDirectory } from './commands/setupSourceDirectory';
import { showRunningMacros } from './commands/showRunningMacros';
import { MACRO_DOCUMENT_SELECTOR } from './core/constants';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibraryManager';
import { expandConfigPaths } from './core/library/utils';
import { ExtensionContext } from './extensionContext';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { registerDTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { registerExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { registerMacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { registerMacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
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
  context.log.info('Activating extension:', extensionContext.extension.packageJSON.version);

  extensionContext.subscriptions.push(
    registerDTSCodeActionProvider(MACRO_DOCUMENT_SELECTOR),
    registerExecuteCommandCompletionProvider(MACRO_DOCUMENT_SELECTOR),
    registerMacroCodeLensProvider(MACRO_DOCUMENT_SELECTOR),
    registerMacroOptionsCompletionProvider(MACRO_DOCUMENT_SELECTOR),
    // AI
    registerMacroChatParticipant(context),
    registerMacroCreateLanguageModelTool(context),
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

  await runStartupMacros(context);
}

async function runStartupMacros(context: ExtensionContext) {
  const paths = expandConfigPaths('macros.startupMacros');
  if (paths.length === 0) {
    return;
  }

  const existingPaths = paths.filter((path) => existsSync(path));
  if (existingPaths.length === 0) {
    context.log.warn('Skipped all startup macros: none were found.');
    return;
  } else if (existingPaths.length !== paths.length) {
    const nonExistingPaths = paths.filter((path) => !existingPaths.includes(path));
    context.log.warn(
      'Skipped startup macros that were not found:',
      ...nonExistingPaths.map((path) => `"${vscode.workspace.asRelativePath(path, true)}"`));
  }

  context.log.info('Running startup macros:',
    ...existingPaths.map((path) => `"${vscode.workspace.asRelativePath(path, true)}"`));
  await Promise.all(
    existingPaths.map((path) => runMacro(context, path, true)),
  );
}