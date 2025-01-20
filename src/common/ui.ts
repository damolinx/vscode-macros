import * as vscode from 'vscode';
import { relative } from 'path';
import { Macro } from '../macro';

export const MACROS_FILTER = { 'Macro Files': ['js'] };

type UriQuickPickItem = vscode.QuickPickItem & {
  uri?: vscode.Uri;
};

const QuickPickOpenFile: vscode.QuickPickItem = {
  label: 'Open File …'
};

export function pickMacroFile(macroFiles: Record<string, vscode.Uri[]>): Promise<vscode.Uri | undefined> {
  return new Promise((resolve) => {
    const quickPick = createMacroQuickPick();
    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
    quickPick.onDidAccept(async () => {
      let uri: vscode.Uri | undefined;
      const selectedItem = quickPick.selectedItems[0];
      if (selectedItem === QuickPickOpenFile) {
        uri = await showMacroOpenDialog();
      } else {
        uri = selectedItem.uri;
      }

      resolve(uri);
      quickPick.hide();
    });

    quickPick.show();
  });

  function createMacroQuickPick() {
    const openFileButton = {
      iconPath: new vscode.ThemeIcon('go-to-file'),
      tooltip: 'Open File',
    };
    const items: UriQuickPickItem[] = [
      QuickPickOpenFile,
      {
        label: '',
        kind: vscode.QuickPickItemKind.Separator
      },
      ...createMacroFileItems(openFileButton)
    ];

    const quickPick = vscode.window.createQuickPick<UriQuickPickItem>();
    quickPick.placeholder = 'Select a macro…';
    quickPick.items = items;
    quickPick.onDidTriggerItemButton(async (e) => {
      await vscode.commands.executeCommand('vscode.open', e.item.uri);
    });
    return quickPick;
  }

  function createMacroFileItems(openFileButton: { iconPath: vscode.ThemeIcon; tooltip: string; }) {
    const items = [] as UriQuickPickItem[];
    Object.keys(macroFiles).sort()
      .forEach((root) => {
        if (root) {
          items.push({
            label: vscode.workspace.asRelativePath(root),
            kind: vscode.QuickPickItemKind.Separator,
          });
        }

        items.push(...macroFiles[root].map((uri) => ({
          buttons: [openFileButton],
          label: root ? relative(root, uri.fsPath) : vscode.workspace.asRelativePath(uri),
          uri,
        } as UriQuickPickItem))
          .sort((t1, t2) => t1.label.localeCompare(t2.label)));
      });
    return items;
  }
}

export async function showMacroErrorMessage(macro: Macro, error: unknown): Promise<void> {
  const openOption = "Open";
  const option = await vscode.window.showErrorMessage(
    `Failed to run ${macro.shortName}: ${error || '« no error message »'}`,
    openOption
  );

  if (option === openOption) {
    await vscode.commands.executeCommand('vscode.open', macro.uri);
  }
}

export async function showMacroOpenDialog(): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    filters: MACROS_FILTER,
  });

  return selectedUris?.pop();
}
