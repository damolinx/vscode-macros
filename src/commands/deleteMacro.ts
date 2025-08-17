import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { fromLocator, Locator, toUri } from '../utils/uri';

export async function deleteMacro(context: ExtensionContext, locator: Locator) {
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
      await vscode.commands.executeCommand('macros.stop', uri, { noPrompt: true });
    }
  }

  try {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to delete macro: ${err instanceof Error ? err.message : err}`,
    );
  }
}
