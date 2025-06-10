import * as vscode from 'vscode';
import { OpenMacroOptions, pickMacroFile, UriQuickPickItem } from './ui';
import { MacroLibraryManager } from '../core/library/macroLibraryManager';

export async function selectMacroFile(manager: MacroLibraryManager, options?: OpenMacroOptions): Promise<vscode.Uri | undefined> {
  const macroFiles = await manager.getFiles();
  const targetUri = await pickMacroFile(macroFiles, options);
  if (!targetUri) {
    return; // No macro selected.
  }

  return targetUri;
}

export async function selectSourceDirectory(manager: MacroLibraryManager): Promise<vscode.Uri | undefined> {
  const libraries = manager.libraries.get();
  if (libraries.length === 0) {
    const OptionConfigure = 'Configure';
    const option = await vscode.window.showInformationMessage('No configured source directories', OptionConfigure);
    if (option === OptionConfigure) {
      await vscode.commands.executeCommand('macros.sourceDirectories.settings');
      return;
    }
  }

  const selectedItem = await vscode.window.showQuickPick<UriQuickPickItem>(
    libraries.map((library) => ({
      label: vscode.workspace.asRelativePath(library.root),
      uri: library.root,
    })).sort((t1, t2) => t1.label.localeCompare(t2.label)),
    {
      placeHolder: 'Select a macro source directory …',
    },
  );

  return selectedItem?.uri;
}