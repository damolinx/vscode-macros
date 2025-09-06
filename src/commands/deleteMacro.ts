import * as vscode from 'vscode';
import { Macro } from '../core/macro';
import { explorerTreeView } from '../explorer/macroExplorerTreeView';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, toUri } from '../utils/uri';
import { stopMacro } from './stopMacro';

export async function deleteMacro(context: ExtensionContext, locator?: Locator): Promise<void> {
  let targetLocator = locator;
  if (!targetLocator) {
    const treeSelection = explorerTreeView?.selection[0];
    if (treeSelection instanceof Macro) {
      targetLocator = treeSelection;
    }
  }

  if (targetLocator) {
    await deleteMacroFromLocator(context, targetLocator);
  }
}

async function deleteMacroFromLocator(context: ExtensionContext, locator: Locator) {
  const uri = toUri(fromLocator(locator));

  const { runInstanceCount } = context.runnerManager.getRunner(uri);
  if (runInstanceCount) {
    const result = await vscode.window.showInformationMessage(
      'Do you want to stop running instances of this macro before deleting it?',
      {
        modal: true,
        detail:
          'Macros cannot be forcefully stopped. This sends a cancellation request via the `__cancellationToken`.',
      },
      { title: 'Stop and Delete' },
      { title: 'Delete Without Stopping' },
      { title: 'Cancel', isCloseAffordance: true },
    );

    if (!result || result.title === 'Cancel') {
      return;
    } else if (result.title === 'Stop and Delete') {
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
