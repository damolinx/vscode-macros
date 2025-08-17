import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { registerMacroChatParticipant } from './ai/macroChatParticipant';
import { registerMacroCreateLanguageModelTool } from './ai/macroCreateTool';
import { createMacro, updateActiveEditor } from './commands/createMacro';
import { createRepl } from './commands/createRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { deleteMacro } from './commands/deleteMacro';
import { downloadAsset } from './commands/downloadAsset';
import { openMacro } from './commands/openMacro';
import { resetSharedContext } from './commands/resetContext';
import { revealFileInOs } from './commands/revealFileInOS';
import { runActiveEditor, runMacro } from './commands/runMacro';
import {
  registerSourceDirectoryVerifier,
  setupSourceDirectory,
} from './commands/setupSourceDirectory';
import { showRunningMacros } from './commands/showRunningMacros';
import { stopMacro } from './commands/stopMacro';
import { MACRO_DOCUMENT_SELECTOR } from './core/constants';
import { MacroRunInfo } from './core/execution/macroRunInfo';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibraryManager';
import { expandConfigPaths } from './core/library/utils';
import { Macro } from './core/macro';
import { registerMacroExplorerTreeview } from './explorer/macroExplorerTreeView';
import { ExtensionContext } from './extensionContext';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { registerDTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { registerExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { registerMacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { registerMacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
import { Locator, PathLike } from './utils/uri';

/**
 * Extension startup.
 * @param extensionContext Context.
 */
export async function activate(extensionContext: vscode.ExtensionContext) {
  const context = new ExtensionContext(extensionContext);
  extensionContext.subscriptions.push(context, new MacroStatusBarItem(context));
  context.log.info('Activating extension:', extensionContext.extension.packageJSON.version);

  extensionContext.subscriptions.push(
    // AI
    registerMacroChatParticipant(context),
    registerMacroCreateLanguageModelTool(context),
    // Explorer
    ...registerMacroExplorerTreeview(context),
    // Macro File Helpers
    registerMacroCodeLensProvider(MACRO_DOCUMENT_SELECTOR),
    registerDTSCodeActionProvider(MACRO_DOCUMENT_SELECTOR),
    registerExecuteCommandCompletionProvider(MACRO_DOCUMENT_SELECTOR),
    registerMacroOptionsCompletionProvider(MACRO_DOCUMENT_SELECTOR),
  );

  const {
    commands: c,
    commands: { registerCommand: cr },
  } = vscode;
  extensionContext.subscriptions.push(
    cr('macros.debug', debugMacro),
    cr('macros.debug.activeEditor', debugActiveEditor),
    cr('macros.delete', (locator: Locator) => deleteMacro(context, locator)),
    cr('macros.downloadAsset', downloadAsset),
    cr('macros.new.macro', (content?: string) => createMacro(context, content)),
    cr('macros.new.macro.activeEditor', () => updateActiveEditor(context)),
    cr('macros.new.macro.repl', () => createRepl(context)),
    cr('macros.open', () => openMacro(context)),
    cr('macros.resetContext', (pathOrUri: PathLike) => resetSharedContext(context, pathOrUri)),
    cr('macros.revealInExplorer', revealFileInOs),
    cr('macros.revealInFinder', revealFileInOs),
    cr('macros.revealInFiles', revealFileInOs),
    cr('macros.run', (pathOrUriOrMacro?: Locator) => runMacro(context, pathOrUriOrMacro)),
    cr('macros.run.activeEditor', () => runActiveEditor(context)),
    cr('macros.run.mru', () => runMacro(context, context.mruMacro)),
    cr('macros.run.show', () => showRunningMacros(context)),
    cr('macros.sourceDirectories.settings', () =>
      c.executeCommand('workbench.action.openSettings', SOURCE_DIRS_CONFIG),
    ),
    cr('macros.sourceDirectories.setup', () => setupSourceDirectory(context)),
    cr('macros.stop', (uriOrMacroOrRunInfo: vscode.Uri | Macro | MacroRunInfo, ...args: any[]) =>
      stopMacro(context, uriOrMacroOrRunInfo, ...args),
    ),
  );

  if (vscode.workspace.getConfiguration().get('macros.sourceDirectories.verify', true)) {
    extensionContext.subscriptions.push(registerSourceDirectoryVerifier(context));
  }

  await runStartupMacros(context);
}

async function runStartupMacros(context: ExtensionContext) {
  const paths = expandConfigPaths('macros.startupMacros');
  if (paths.length === 0) {
    return;
  }

  const existingPaths = paths.filter((path) => existsSync(path));
  if (existingPaths.length === 0) {
    context.log.warn('No startup macros executed — none found on disk. Count:', paths.length);
    return;
  }

  if (!vscode.workspace.isTrusted) {
    context.log.warn(
      'No startup macros executed — workspace is untrusted. Count:',
      existingPaths.length,
    );

    const manageOption = 'Manage Workspace Trust';
    vscode.window
      .showWarningMessage('Startup macros are disabled in untrusted workspaces.', manageOption)
      .then(
        (selection) =>
          selection === manageOption && vscode.commands.executeCommand('workbench.trust.manage'),
      );

    return;
  }

  if (existingPaths.length !== paths.length) {
    context.log.warn(
      'Some startup macros were not executed — not found on disk:',
      ...paths
        .filter((path) => !existingPaths.includes(path))
        .map((path) => vscode.workspace.asRelativePath(path, true)),
    );
  }

  context.log.info(
    'Startup macros to be executed:',
    ...existingPaths.map((path) => vscode.workspace.asRelativePath(path, true)),
  );

  await Promise.all(existingPaths.map((path) => runMacro(context, path, true)));
}
