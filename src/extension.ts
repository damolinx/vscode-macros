import * as vscode from 'vscode';
import { registerCreateMacroContentTool } from './ai/createMacroContentTool';
import { registerMacroChatParticipant } from './ai/macroChatParticipant';
import { addLibrary } from './commands/addLibrary';
import { copyFile, pasteFile } from './commands/copyPasteFile';
import { copyPath } from './commands/copyPath';
import { createMacro, updateEditor } from './commands/createMacro';
import { createRepl } from './commands/createRepl';
import { debugActiveEditor, debugMacro } from './commands/debugMacro';
import { deleteMacroOrMacroLibrary } from './commands/deleteMacroOrMacroLibrary';
import { downloadAsset } from './commands/downloadAsset';
import { openMacro } from './commands/openMacro';
import { removeStartupMacro } from './commands/removeStartupMacro';
import { renameMacro } from './commands/renameMacro';
import { resetSharedContext } from './commands/resetContext';
import { revealInOS } from './commands/revealInOS';
import { revealRelatedMacroInTree } from './commands/revealRelatedMacroInTree';
import { runActiveEditor, runMacro } from './commands/runMacro';
import { setStartupMacro } from './commands/setStartupMacro';
import {
  registerSourceDirectoryVerifier,
  setupSourceDirectory,
} from './commands/setupSourceDirectory';
import { showRunCode } from './commands/showRunCode';
import { showRunningMacros } from './commands/showRunningMacros';
import { stopMacro } from './commands/stopMacro';
import { SandboxExecutionDescriptor } from './core/execution/sandboxExecutionDescriptor';
import { MacroLibrary } from './core/library/macroLibrary';
import { SOURCE_DIRS_CONFIG } from './core/library/macroLibrarySourceManager';
import { Macro } from './core/macro';
import { StartupMacro } from './core/startupMacro';
import { ExtensionContext } from './extensionContext';
import { registerContextValueHandlers } from './extensionContextValues';
import { MacroStatusBarItem } from './macroStatusBarItem';
import { registerDTSCodeActionProvider } from './providers/dtsCodeActionProvider';
import { registerExecuteCommandCompletionProvider } from './providers/executeCommandCompletionProvider';
import { registerFillCodeLensProvider } from './providers/fillCodeLensProvider';
import { registerMacroCodeLensProvider } from './providers/macroCodeLensProvider';
import { registerMacroOptionsCompletionProvider } from './providers/macroOptionsCompletionProvider';
import { registerMacroSnapshotContentProvider } from './providers/macroSnapshotContentProvider';
import { existsFile } from './utils/fsEx';
import { UriLocator, areUriEqual } from './utils/uri';
import { refreshTreeView, registerTreeViews, revealTreeView } from './views/treeViews';

/**
 * Extension startup.
 * @param extensionContext Context.
 */
export async function activate(extensionContext: vscode.ExtensionContext) {
  const context = new ExtensionContext(extensionContext);
  context.log.info('Activating extension', extensionContext.extension.packageJSON.version);

  context.disposables.push(new MacroStatusBarItem(context));

  registerCreateMacroContentTool(context);
  registerMacroChatParticipant(context);

  registerTreeViews(context);

  registerMacroSnapshotContentProvider(context);
  registerContextValueHandlers(context);
  registerSourceDirectoryVerifier(context);
  registerDTSCodeActionProvider(context);
  registerExecuteCommandCompletionProvider(context);
  registerFillCodeLensProvider(context);
  registerMacroCodeLensProvider(context);
  registerMacroOptionsCompletionProvider(context);

  const {
    commands: { registerCommand: cr },
  } = vscode;
  context.disposables.push(
    cr('macros.copy.file', (locator: UriLocator) => copyFile(context, locator)),
    cr('macros.copy.name', (locator: UriLocator) => copyPath(context, locator, true)),
    cr('macros.copy.path', (locator?: UriLocator) => copyPath(context, locator)),
    cr('macros.debug', (locator?: UriLocator) => debugMacro(context, locator)),
    cr('macros.debug.activeEditor', () => debugActiveEditor(context)),
    cr('macros.delete.macroOrMacroLibrary', (macroOrLibrary?: Macro | MacroLibrary) =>
      deleteMacroOrMacroLibrary(context, macroOrLibrary),
    ),
    cr('macros.delete.startupMacro', (locator: UriLocator) => removeStartupMacro(context, locator)),
    cr('macros.downloadAsset', (assetUri: vscode.Uri, locator: UriLocator) =>
      downloadAsset(context, assetUri, locator),
    ),
    cr('macros.explorer.refresh', () => refreshTreeView('explorer')),
    cr('macros.new.macro', (locator?: UriLocator) => createMacro(context, locator)),
    cr('macros.new.macro.activeEditor', (locator?: UriLocator) => updateEditor(context, locator)),
    cr('macros.new.macro.repl', () => createRepl(context)),
    cr('macros.new.macroLibrary', () => addLibrary(context)),
    cr('macros.new.startupMacro', (locator: UriLocator) => setStartupMacro(context, locator)),
    cr('macros.open', () => openMacro(context)),
    cr('macros.paste.file', (locator: UriLocator) => pasteFile(context, locator)),
    cr('macros.rename.macro', (locator?: UriLocator) => renameMacro(context, locator)),
    cr('macros.resetContext', (locator: UriLocator) => resetSharedContext(context, locator)),
    cr('macros.revealInExplorer', (locator?: UriLocator) => revealInOS(locator)),
    cr('macros.revealInFinder', (locator?: UriLocator) => revealInOS(locator)),
    cr('macros.revealInFiles', (locator?: UriLocator) => revealInOS(locator)),
    cr('macros.revealRelatedMacroInTree', (startupMacro: StartupMacro) =>
      revealRelatedMacroInTree(startupMacro),
    ),
    cr('macros.run', (locator?: UriLocator, ...args: any[]) => runMacro(context, locator, ...args)),
    cr('macros.run.activeEditor', () => runActiveEditor(context)),
    cr('macros.run.mru', (...args: any[]) => runMacro(context, context.mruMacro, ...args)),
    cr('macros.run.show', () => showRunningMacros(context)),
    cr('macros.runView', (descriptor: SandboxExecutionDescriptor) => showRunCode(descriptor)),
    cr('macros.showMacroExplorer', () => revealTreeView('explorer')),
    cr('macros.showStartupMacros', () => revealTreeView('startup')),
    cr('macros.sourceDirectories.settings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', SOURCE_DIRS_CONFIG),
    ),
    cr('macros.sourceDirectories.setup', (uri: vscode.Uri) => setupSourceDirectory(context, uri)),
    cr('macros.startup.refresh', () => refreshTreeView('startup')),
    cr('macros.startup.settings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', 'macros.startup'),
    ),
    cr('macros.stop', (locator: Macro | SandboxExecutionDescriptor | StartupMacro | vscode.Uri) =>
      stopMacro(context, locator),
    ),
  );

  await runStartupMacros(context);
}

async function runStartupMacros(context: ExtensionContext): Promise<void> {
  const uris = context.startupManager.sources.map((s) => s.uri);
  if (uris.length === 0) {
    context.log.info('No startup macros to execute — none registered');
    return;
  }

  const existingUris = (
    await Promise.all(uris.map((uri) => existsFile(uri).then((exists) => exists && uri)))
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
