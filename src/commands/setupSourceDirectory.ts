import * as vscode from 'vscode';
import { isFeatureEnabledMacro } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { selectSourceDirectory } from '../ui/selectMacroFile';
import { LazyDisposable } from '../utils/lazy';
import { readFile } from '../utils/resources';
import { parent, UriLocator } from '../utils/uri';

export const AUTO_VERIFY_SETTING = 'macros.sourceDirectoriesVerification';
export const GLOBALS_RESOURCE = 'api/global.d.ts';
export const JSCONFIG_RESOURCE = 'api/jsconfig.json';

export function registerSourceDirectoryVerifier(context: ExtensionContext): void {
  const verifiedPaths = new Set<string>();
  const onDidChangeActiveTextEditorDisposable = new LazyDisposable(() =>
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      const uri = editor?.document.uri;
      if (
        !uri ||
        uri.scheme !== 'file' ||
        verifiedPaths.has(uri.toString()) ||
        !isFeatureEnabledMacro(uri)
      ) {
        return;
      }
      verifiedPaths.add(uri.fsPath);

      const parentUri = parent(uri);
      if (verifiedPaths.has(parentUri.fsPath)) {
        return;
      }
      verifiedPaths.add(parentUri.fsPath);

      await setupSourceDirectory(context, parentUri, true);
    }),
  );

  context.extensionContext.subscriptions.push(
    onDidChangeActiveTextEditorDisposable,
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(AUTO_VERIFY_SETTING)) {
        if (isSettingEnabled()) {
          onDidChangeActiveTextEditorDisposable.initialize();
        } else {
          onDidChangeActiveTextEditorDisposable.reset();
          verifiedPaths.clear();
        }
      }
    }),
  );

  if (isSettingEnabled()) {
    onDidChangeActiveTextEditorDisposable.initialize();
  }

  function isSettingEnabled() {
    return vscode.workspace.getConfiguration().get(AUTO_VERIFY_SETTING, true);
  }
}

export async function setupSourceDirectory(
  context: ExtensionContext,
  locator?: UriLocator,
  suppressNotifications?: true,
): Promise<void> {
  const uri = locator
    ? locator instanceof vscode.Uri
      ? locator
      : locator.uri
    : await selectSourceDirectory(context.libraryManager);

  if (!uri) {
    return; // Nothing to run.
  }

  context.log.debug('Verifying development files', vscode.workspace.asRelativePath(uri));
  const encoder = new TextEncoder();
  const edit = new vscode.WorkspaceEdit();
  const updatingFiles = (
    await Promise.all([
      update(uri, GLOBALS_RESOURCE, 'global.d.ts'),
      update(uri, JSCONFIG_RESOURCE, 'jsconfig.json'),
    ])
  ).some((result) => result);

  if (!updatingFiles) {
    context.log.info('All development files are up-to-date');
    if (!suppressNotifications) {
      vscode.window.showInformationMessage('All files are up-to-date.');
    }
    return; // Nothing to update.
  }

  const result = await vscode.workspace.applyEdit(edit);
  if (!suppressNotifications) {
    if (result) {
      context.log.info('Updated development files to the latest version —', uri.fsPath);
      vscode.window.showInformationMessage('Updated files to the latest version.');
    } else {
      context.log.error('Failed to update development files —', uri.fsPath);
      vscode.window.showErrorMessage(`Could not update ${uri.fsPath}`);
    }
  }

  async function update(uri: vscode.Uri, source: string, target: string): Promise<boolean> {
    const [currentContents, newContents] = await Promise.all([
      vscode.workspace.openTextDocument(vscode.Uri.joinPath(uri, target)).then(
        (d) => d.getText(),
        () => '',
      ),
      readFile(context.extensionContext, source),
    ]);
    if (currentContents === newContents) {
      return false;
    }

    const updatedUri = vscode.Uri.joinPath(uri, target);
    edit.createFile(updatedUri, {
      overwrite: true,
      contents: encoder.encode(newContents),
    });

    context.log.debug('  Updating', vscode.workspace.asRelativePath(updatedUri));
    return true;
  }
}
