import * as vscode from 'vscode';

export type UriQuickPickItem = vscode.QuickPickItem & {
  uri: vscode.Uri;
};

export function pickMacroFile(macroFiles: vscode.Uri[]): Promise<vscode.Uri | undefined> {
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
    const openButton = {
      iconPath: new vscode.ThemeIcon('go-to-file'),
      tooltip: 'Open file',
    };
    const items = macroFiles.map((uri) => (<UriQuickPickItem>{
      buttons: [openButton],
      label: vscode.workspace.asRelativePath(uri),
      uri,
    }));

    const quickPick = vscode.window.createQuickPick<UriQuickPickItem>();
    quickPick.placeholder = 'Select a macro…';
    quickPick.items = items;
    quickPick.onDidTriggerItemButton(async (e) => {
      await vscode.commands.executeCommand('vscode.open', e.item.uri);
    });
    return quickPick;
  }
}