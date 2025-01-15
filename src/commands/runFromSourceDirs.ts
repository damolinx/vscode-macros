import { extname } from 'path';
import * as vscode from 'vscode';

export async function runMacroFromSourceDirs() {
  const sourceDirectories = vscode.workspace.getConfiguration().get<string[]>('macros.sourceDirectories', []);
  if (sourceDirectories.length === 0) {
    vscode.window.showInformationMessage('No configured source directories');
    return;
  }

  const macroFiles = await findMacroFiles(sourceDirectories.map((d) => d.trim()));
  if (macroFiles.length === 0) {
    vscode.window.showInformationMessage('No macro files in configured source directories');
    return;
  }

  const targetUri = await pickMacroFile(macroFiles.sort());
  if (!targetUri) {
    return; // No macro selected.
  }

  await vscode.commands.executeCommand('macros.run', targetUri);
}

function pickMacroFile(macroFiles: vscode.Uri[]): Promise<vscode.Uri | undefined> {
  return new Promise((resolve) => {
    const quickPick = createMacroQuickPick();
    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
    quickPick.onDidAccept(() => {
      resolve(quickPick.selectedItems[0].uri);
      quickPick.hide()
    });

    quickPick.show();
  });

  function createMacroQuickPick() {
    const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem & { uri: vscode.Uri }>();
    quickPick.placeholder = 'Select a macro to run';
    quickPick.items = macroFiles.map((uri) => (<vscode.QuickPickItem & { uri: vscode.Uri }>{
      buttons: [
        {
          iconPath: new vscode.ThemeIcon('go-to-file'),
          tooltip: 'Open file',
        }
      ],
      label: vscode.workspace.asRelativePath(uri),
      uri,
    }));
    quickPick.onDidTriggerItemButton(async (e) => {
      await vscode.commands.executeCommand('vscode.open', e.item.uri);
    });
    return quickPick;
  }
}

async function findMacroFiles(sourceDirectories: string[]): Promise<vscode.Uri[]> {
  const files = await Promise.all(
    sourceDirectories.map(async (sourceDirectory) => {
      const uri = vscode.Uri.file(sourceDirectory);
      const entries = await vscode.workspace.fs.readDirectory(uri);
      return entries
        .filter(([path, type]) => type === vscode.FileType.File && extname(path) === '.js')
        .map(([path, _]) => vscode.Uri.joinPath(uri, path));
    }),
  );

  return files.flat();
}