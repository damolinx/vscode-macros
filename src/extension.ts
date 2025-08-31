import * as vscode from 'vscode';
import { registerMacroChatParticipant } from './ai/macroChatParticipant';
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
import { MacroRunInfo } from './core/execution/macroRunInfo';
import { macroDocumentSelector } from './core/language';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibraryManager';
import { loadConfigUris } from './core/library/utils';
import { Macro } from './core/macro';
import {
  MACRO_EXPLORER_VIEW_ID,
  registerMacroExplorerTreeview,
} from './explorer/macroExplorerTreeView';
import { ExtensionContext } from './extensionContext';
import { registerSetContextHandlers } from './extensionContextKeys';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { registerDTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { registerExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { registerMacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { registerMacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
import { Locator, PathLike, areUriEqual } from './utils/uri';

/**
 * Extension startup.
 * @param extensionContext Context.
 */
export async function activate(extensionContext: vscode.ExtensionContext) {
  const context = new ExtensionContext(extensionContext);
  extensionContext.subscriptions.push(context, new MacroStatusBarItem(context));
  context.log.info('Activating extension', extensionContext.extension.packageJSON.version);

  const documentSelector = macroDocumentSelector();
  extensionContext.subscriptions.push(
    // AI
    registerMacroChatParticipant(context),
    // Explorer
    ...registerMacroExplorerTreeview(context),
    // Macro File Helpers
    registerMacroCodeLensProvider(documentSelector),
    registerDTSCodeActionProvider(documentSelector),
    registerExecuteCommandCompletionProvider(documentSelector),
    registerMacroOptionsCompletionProvider(documentSelector),
    // Context Helper
    ...registerSetContextHandlers(context),
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
    cr('macros.new.macro', (locator: Locator) => createMacro(context, locator)),
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
    cr('macros.showMacroExplorer', () =>
      vscode.commands.executeCommand(`${MACRO_EXPLORER_VIEW_ID}.focus`),
    ),
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

async function runStartupMacros(context: ExtensionContext): Promise<void> {
  const uris = loadConfigUris('macros.startupMacros');
  if (uris.length === 0) {
    context.log.info('No startup macros to execute — none registered');
    return;
  }

  const existingUris = (
    await Promise.all(
      uris.map((uri) =>
        vscode.workspace.fs.stat(uri).then(
          (stat) => (stat.type === vscode.FileType.File ? uri : undefined),
          () => undefined,
        ),
      ),
    )
  ).filter((uri) => !!uri);

  if (existingUris.length === 0) {
    context.log.info(
      'Executing no startup macros out of',
      uris.length,
      'registered — none found on disk',
    );
    return;
  }

  if (!vscode.workspace.isTrusted) {
    context.log.warn(
      'Executing no startup macros out of',
      existingUris.length,
      'registered — untrusted workspace',
    );

    vscode.window
      .showWarningMessage(
        `Startup macros are disabled in untrusted workspaces — ${existingUris.length} registered`,
        'Manage Workspace Trust',
      )
      .then((selection) => selection && vscode.commands.executeCommand('workbench.trust.manage'));

    return;
  }

  if (existingUris.length !== uris.length) {
    context.log.info(
      'Executing',
      existingUris.length,
      'out of',
      uris.length,
      'registered macros — not found:',
      ...uris
        .filter((uri) => existingUris.every((exUri) => !areUriEqual(uri, exUri)))
        .map((uri) => vscode.workspace.asRelativePath(uri)),
    );
  } else {
    context.log.info('Executing all', existingUris.length, ' of registered macros.');
  }

  await Promise.all(existingUris.map((uri) => runMacro(context, uri, true)));
}
