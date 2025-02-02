import * as vscode from 'vscode';
import { relative } from 'path';
import { showTextDocument } from './vscodeEx';

export const MACROS_FILTER = { 'Macro Files': ['js'] };

export interface OpenMacroOptions {
  hideOpen?: boolean;
  hideOpenPerItem?: boolean
}

export interface UriQuickPickItem extends vscode.QuickPickItem {
  uri?: vscode.Uri
}

const QuickPickOpenFile: vscode.QuickPickItem = {
  label: 'Open File …'
};

let lastSelection: vscode.Uri | undefined;

export function pickMacroFile(macroFiles: vscode.Uri[] | Record<string, vscode.Uri[]>, options?: OpenMacroOptions): Promise<vscode.Uri | undefined> {
  return new Promise((resolve) => {
    const quickPick = createMacroQuickPick();
    if (lastSelection) {
      const preselect = quickPick.items.find((item) => item.uri?.toString() === lastSelection!.toString());
      if (preselect) {
        quickPick.activeItems = [preselect];
      }
    }

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

      if (uri) {
        lastSelection = uri;
      }

      resolve(uri);
      quickPick.hide();
    });

    quickPick.show();
  });

  function createMacroQuickPick() {
    const openFileButton = options?.hideOpenPerItem
      ? undefined
      : {
        iconPath: new vscode.ThemeIcon('go-to-file'),
        tooltip: 'Open File',
      };
    const items: UriQuickPickItem[] = createMacroFileItems(openFileButton);
    if (!options?.hideOpen) {
      items.unshift(QuickPickOpenFile,
        {
          label: '',
          kind: vscode.QuickPickItemKind.Separator
        });
    }

    const quickPick = vscode.window.createQuickPick<UriQuickPickItem>();
    quickPick.placeholder = 'Select a macro…';
    quickPick.items = items;
    quickPick.onDidTriggerItemButton((e) => e.item.uri && showTextDocument(e.item.uri));
    return quickPick;
  }

  function createMacroFileItems(openFileButton?: { iconPath: vscode.ThemeIcon; tooltip: string; }) {
    const items = [] as UriQuickPickItem[];
    if (macroFiles instanceof Array) {
      items.push(...createItems(macroFiles));
    } else {
      Object.keys(macroFiles)
        .map((root) => ({ root, label: vscode.workspace.asRelativePath(root) }))
        .sort((t1, t2) => t1.label.localeCompare(t2.label))
        .forEach(({ root, label }) => {

          items.push({
            label: label,
            kind: vscode.QuickPickItemKind.Separator,
          });

          items.push(...createItems(macroFiles[root], root));
        });
    }
    return items;

    function createItems(uris: vscode.Uri[], root?: string): UriQuickPickItem[] {
      return uris
        .map((uri) => ({
          buttons: openFileButton && [openFileButton],
          label: root ? relative(root, uri.fsPath) : vscode.workspace.asRelativePath(uri),
          uri,
        }))
        .sort((t1, t2) => t1.label.localeCompare(t2.label));
    }
  }
}

export async function showMacroOpenDialog(): Promise<vscode.Uri | undefined> {
  const selectedUris = await vscode.window.showOpenDialog({
    filters: MACROS_FILTER,
  });

  return selectedUris?.pop();
}

export async function showMacroSaveDialog(): Promise<vscode.Uri | undefined> {
  const selectedUri = await vscode.window.showSaveDialog({
    filters: MACROS_FILTER
  });
  return selectedUri;
}
