import * as vscode from 'vscode';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { areUriEqual, isUntitled } from '../utils/uri';
import { explorerTreeView } from '../views/treeViews';
import { stopMacro } from './stopMacro';

export async function deleteMacroOrMacroLibrary(
  context: ExtensionContext,
  macroOrLibrary?: Macro | MacroLibrary,
): Promise<void> {
  const targetMacroOrLibrary = macroOrLibrary ?? explorerTreeView?.selection[0];
  if (
    !targetMacroOrLibrary ||
    !(targetMacroOrLibrary instanceof Macro || targetMacroOrLibrary instanceof MacroLibrary)
  ) {
    context.log.debug('No macro or library selected for deletion.');
    return;
  }

  if (isUntitled(targetMacroOrLibrary.uri)) {
    context.log.debug('Cannot delete an untitled item.');
    return;
  }

  if (targetMacroOrLibrary instanceof MacroLibrary) {
    await deleteMacroLibrary(context, targetMacroOrLibrary);
  } else {
    await deleteMacro(context, targetMacroOrLibrary);
  }
}

async function deleteMacro(context: ExtensionContext, { uri }: Macro): Promise<void> {
  if (context.sandboxManager.isRunning(uri)) {
    const stopOption: vscode.MessageItem = { title: 'Stop and Delete' };
    const result = await vscode.window.showInformationMessage(
      'Do you want to stop running instances of this macro before deleting it?',
      {
        modal: true,
        detail:
          'Macros cannot be forcefully stopped. This sends a cancellation request via the `__cancellationToken`.',
      },
      stopOption,
      { title: 'Delete Without Stopping' },
      { title: 'Cancel', isCloseAffordance: true },
    );

    if (!result || result.isCloseAffordance) {
      return;
    } else if (result === stopOption) {
      await stopMacro(context, uri);
    }
  }

  if (await context.startupManager.removeSourceFor(uri)) {
    context.log.info('Removed startup macro', uri.toString(true));
  }

  try {
    await vscode.workspace.fs.delete(uri, { useTrash: uri.scheme === 'file' && !context.isRemote });
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to delete macro: ${err instanceof Error ? err.message : err}`,
    );
  }
}

export async function deleteMacroLibrary(
  { libraryManager }: ExtensionContext,
  { uri }: MacroLibrary,
): Promise<void> {
  const library = libraryManager.sourcesManager.sources.find((s) => areUriEqual(s.uri, uri));
  if (!library) {
    return;
  }

  const items: (vscode.MessageItem & { target?: vscode.ConfigurationTarget })[] = [
    { title: 'Delete' },
    ...library.configSources.map((s) => ({
      title: `Remove from ${s.target === vscode.ConfigurationTarget.Global ? 'User' : 'Workspace'} Settings`,
      target: s.target,
    })),
    { title: 'Cancel', isCloseAffordance: true },
  ];

  const result = await vscode.window.showInformationMessage(
    'Do you want to delete the folder, or just remove the library from settings?',
    {
      modal: true,
      detail: 'Deleting the folder also removes all of its settings entries.',
    },
    ...items,
  );
  if (!result || result.isCloseAffordance) {
    return;
  }

  if (!result.target) {
    await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
  }
  await libraryManager.sourcesManager.removeSourceFor(uri, result.target);
}
