import * as vscode from 'vscode';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { formatDisplayUri } from '../utils/ui';
import { areUriEqual, isUntitled } from '../utils/uri';
import { explorerTreeView } from '../views/treeViews';
import { stopMacro } from './stopMacro';

export async function deleteMacroOrMacroLibrary(
  context: ExtensionContext,
  macroOrLibrary?: Macro | MacroLibrary,
): Promise<void> {
  const target = macroOrLibrary ?? explorerTreeView?.selection[0];
  if (!target || !('uri' in target)) {
    context.log.info('No macro or library selected for deletion.');
    return;
  }

  if (isUntitled(target.uri)) {
    context.log.warn('Cannot delete an untitled item.', formatDisplayUri(target.uri));
    return;
  }

  if (target instanceof MacroLibrary) {
    await deleteLibrary(context, target);
  } else if (target instanceof Macro) {
    await deleteMacro(context, target);
  }
}

async function deleteLibrary(
  { libraryManager }: ExtensionContext,
  { uri }: MacroLibrary,
): Promise<void> {
  const library = libraryManager.sourcesManager.sources.find((s) => areUriEqual(s.uri, uri));
  if (!library) {
    return;
  }

  const deleteItem: vscode.MessageItem = { title: 'Delete' };
  const items: (vscode.MessageItem & { target?: vscode.ConfigurationTarget })[] = [
    deleteItem,
    ...library.configSources.map((s) => ({
      title: `Remove from ${s.target === vscode.ConfigurationTarget.Global ? 'User' : 'Workspace'} Settings`,
      target: s.target,
    })),
    { title: 'Cancel', isCloseAffordance: true },
  ];

  const result = await vscode.window.showInformationMessage(
    'Delete the folder or unregister it from settings?',
    {
      modal: true,
      detail: 'Deleting the folder also removes all of its settings entries.',
    },
    ...items,
  );
  if (!result || result.isCloseAffordance) {
    return;
  }

  if (result === deleteItem) {
    await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
  }
  await libraryManager.sourcesManager.removeSourceFor(uri, result.target);
}

async function deleteMacro(context: ExtensionContext, { uri }: Macro): Promise<void> {
  if (context.sandboxManager.isRunning(uri)) {
    const stopOption: vscode.MessageItem = { title: 'Stop and Delete' };
    const result = await vscode.window.showInformationMessage(
      'Stop running instances before deleting this macro?',
      {
        modal: true,
        detail:
          'Running macros cannot be forcefully terminated; this sends a cancellation request.',
      },
      stopOption,
      { title: 'Delete Without Stopping' },
      { title: 'Cancel', isCloseAffordance: true },
    );

    if (!result || result.isCloseAffordance) {
      return;
    }

    if (result === stopOption) {
      await stopMacro(context, uri);
    }
  }

  if (await context.startupManager.removeSourceFor(uri)) {
    context.log.info('Removed startup registration for macro', formatDisplayUri(uri));
  }

  try {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  } catch (err) {
    vscode.window.showErrorMessage(
      `Could not delete macro: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
