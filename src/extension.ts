import * as vscode from 'vscode';
import { registerMacroChatParticipant } from './ai/macroChatParticipant';
import { addLibrary } from './commands/addLibrary';
import { addStartupMacro } from './commands/addStartupMacro';
import { copyPath } from './commands/copyPath';
import { createMacro, updateActiveEditor } from './commands/createMacro';
import { createRepl } from './commands/createRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { deleteMacroOrMacroLibrary } from './commands/deleteMacroOrMacroLibrary';
import { downloadAsset } from './commands/downloadAsset';
import { openMacro } from './commands/openMacro';
import { removeStartupMacro } from './commands/removeStartupMacro';
import { renameMacro } from './commands/renameMacro';
import { resetSharedContext } from './commands/resetContext';
import { revealInOS } from './commands/revealInOS';
import { runActiveEditor, runMacro } from './commands/runMacro';
import {
  registerSourceDirectoryVerifier,
  setupSourceDirectory,
} from './commands/setupSourceDirectory';
import { showRunCode } from './commands/showRunCode';
import { showRunningMacros } from './commands/showRunningMacros';
import { stopMacro } from './commands/stopMacro';
import { MacroRunInfo } from './core/execution/macroRunInfo';
import { MacroLibrary } from './core/library/macroLibrary';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibrarySourceManager';
import { StartupMacroLibrarySourceManager } from './core/library/startupMacroLibrarySourceManager';
import { Macro } from './core/macro';
import {
  explorerTreeDataProvider,
  MACRO_EXPLORER_VIEW_ID,
  registerExplorerTreeview,
} from './explorer/explorerTreeView';
import { ExtensionContext } from './extensionContext';
import { registerContextValueHandlers } from './extensionContextValues';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { registerDTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { registerExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { registerMacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { registerMacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
import { registerMacroSnapshotContentProvider } from './providers/macroSnapshotContentProvider';
import { Locator, PathLike, areUriEqual } from './utils/uri';

/**
 * Extension startup.
 * @param extensionContext Context.
 */
export async function activate(extensionContext: vscode.ExtensionContext) {
  const context = new ExtensionContext(extensionContext);
  context.log.info('Activating extension', extensionContext.extension.packageJSON.version);

  extensionContext.subscriptions.push(context, new MacroStatusBarItem(context));

  registerMacroChatParticipant(context);
  registerExplorerTreeview(context);
  registerMacroSnapshotContentProvider(context);
  registerContextValueHandlers(context);
  registerSourceDirectoryVerifier(context);
  registerDTSCodeActionProvider(context);
  registerExecuteCommandCompletionProvider(context);
  registerMacroCodeLensProvider(context);
  registerMacroOptionsCompletionProvider(context);

  const {
    commands: c,
    commands: { registerCommand: cr },
  } = vscode;
  extensionContext.subscriptions.push(
    cr('macros.copy.name', (locator: Locator) => copyPath(context, locator, true)),
    cr('macros.copy.path', (locator?: Locator) => copyPath(context, locator)),
    cr('macros.debug', debugMacro),
    cr('macros.debug.activeEditor', debugActiveEditor),
    cr('macros.delete.macroOrMacroLibrary', (macroOrLibrary?: Macro | MacroLibrary) =>
      deleteMacroOrMacroLibrary(context, macroOrLibrary),
    ),
    cr('macros.delete.startupMacro', (locator: Locator) => removeStartupMacro(context, locator)),
    cr('macros.downloadAsset', downloadAsset),
    cr('macros.explorer.refresh', () => explorerTreeDataProvider?.refresh()),
    cr('macros.new.macro', (locator: Locator) => createMacro(context, locator)),
    cr('macros.new.macro.activeEditor', () => updateActiveEditor(context)),
    cr('macros.new.macro.repl', () => createRepl(context)),
    cr('macros.new.macroLibrary', () => addLibrary(context)),
    cr('macros.new.startupMacro', (locator: Locator) => addStartupMacro(context, locator)),
    cr('macros.open', () => openMacro(context)),
    cr('macros.rename.macro', (locator?: Locator) => renameMacro(context, locator)),
    cr('macros.resetContext', (pathOrUri: PathLike) => resetSharedContext(context, pathOrUri)),
    cr('macros.revealInExplorer', (locator?: Locator) => revealInOS(locator)),
    cr('macros.revealInFinder', (locator?: Locator) => revealInOS(locator)),
    cr('macros.revealInFiles', (locator?: Locator) => revealInOS(locator)),
    cr('macros.run', (locator?: Locator, ...args: any[]) => runMacro(context, locator, ...args)),
    cr('macros.run.activeEditor', () => runActiveEditor(context)),
    cr('macros.run.mru', (...args: any[]) => runMacro(context, context.mruMacro, ...args)),
    cr('macros.run.show', () => showRunningMacros(context)),
    cr('macros.runView', (runInfo: MacroRunInfo) => showRunCode(runInfo)),
    cr('macros.showMacroExplorer', () =>
      vscode.commands.executeCommand(`${MACRO_EXPLORER_VIEW_ID}.focus`),
    ),
    cr('macros.sourceDirectories.settings', () =>
      c.executeCommand('workbench.action.openSettings', SOURCE_DIRS_CONFIG),
    ),
    cr('macros.sourceDirectories.setup', (uri: vscode.Uri) => setupSourceDirectory(context, uri)),
    cr('macros.stop', (uriOrMacroOrRunInfo: vscode.Uri | Macro | MacroRunInfo) =>
      stopMacro(context, uriOrMacroOrRunInfo),
    ),
  );

  await runStartupMacros(context);
}

async function runStartupMacros(context: ExtensionContext): Promise<void> {
  const uris = StartupMacroLibrarySourceManager.instance.sources.map((s) => s.uri);
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
    context.log.info('Executing all', existingUris.length, 'of registered macros.');
  }

  // DO NO await, macros might be long running
  Promise.all(existingUris.map((uri) => runMacro(context, uri, { startup: true })));
}
