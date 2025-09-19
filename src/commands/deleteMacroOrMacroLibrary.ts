import * as vscode from 'vscode';
import { MacroLibrary } from '../core/library/macroLibrary';
import { Macro } from '../core/macro';
import { explorerTreeView } from '../explorer/macroExplorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { areUriEqual, isUntitled } from '../utils/uri';
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
  const { runInstanceCount } = context.runnerManager.getRunner(uri);
  if (runInstanceCount) {
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
      await stopMacro(context, uri, { noPrompt: true });
    }
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
    ...library.sources.map((s) => ({
      title: `Remove from ${s.target === vscode.ConfigurationTarget.Global ? 'User' : 'Workspace'} Settings`,
      target: s.target,
    })),
    { title: 'Cancel', isCloseAffordance: true },
  ];

  const result = await vscode.window.showInformationMessage(
    'Do you want to remove this macro library?',
    {
      modal: true,
      detail: 'Removing a library will keep its folder and files on disk.',
    },
    ...items,
  );

  if (result && !result.isCloseAffordance) {
    await libraryManager.sourcesManager.removeLibrary(uri, result.target);
  }
}
