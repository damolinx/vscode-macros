import * as vscode from 'vscode';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';
import { NaturalComparer } from '../utils/ui';
import { OpenMacroOptions, pickMacroFile, UriQuickPickItem } from './ui';

export async function selectMacroFile(
  manager: MacroLibraryManager,
  options?: OpenMacroOptions,
): Promise<vscode.Uri | undefined> {
  const macroFiles = await getFiles(manager);
  const targetUri = await pickMacroFile(macroFiles, options);
  if (!targetUri) {
    return; // No macro selected.
  }

  return targetUri;
}

export async function selectSourceDirectory(
  manager: MacroLibraryManager,
): Promise<vscode.Uri | undefined> {
  const libraries = manager.libraries;
  if (libraries.length === 0) {
    const OptionConfigure = 'Configure';
    const option = await vscode.window.showInformationMessage(
      'No configured source directories',
      OptionConfigure,
    );
    if (option === OptionConfigure) {
      await vscode.commands.executeCommand('macros.sourceDirectories.settings');
      return;
    }
  }

  const selectedItem = await vscode.window.showQuickPick<UriQuickPickItem>(
    libraries
      .map((library) => ({
        label: vscode.workspace.asRelativePath(library.uri),
        uri: library.uri,
      }))
      .sort((t1, t2) => NaturalComparer.compare(t1.label, t2.label)),
    {
      placeHolder: 'Select a source directory …',
    },
  );

  return selectedItem?.uri;
}

async function getFiles(manager: MacroLibraryManager): Promise<Record<string, vscode.Uri[]>> {
  const entries: [string, vscode.Uri[]][] = await Promise.all(
    manager.libraries.map(async (lib) => {
      const items = await lib.getFiles();
      const uris = items.map(({ uri }) => uri);
      return [lib.uri.fsPath, uris];
    }),
  );

  return Object.fromEntries(entries.filter(([_, uris]) => uris.length > 0));
}
