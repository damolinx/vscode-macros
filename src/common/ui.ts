import * as vscode from 'vscode';
import { relative } from 'path';

export const MACROS_FILTER = { 'Macro Files': ['js'] };

export type OpenMacroOptions = {
  hideOpen?: boolean;
  hideOpenPerItem?: boolean;
};

type UriQuickPickItem = vscode.QuickPickItem & {
  uri?: vscode.Uri;
};

const QuickPickOpenFile: vscode.QuickPickItem = {
  label: 'Open File …'
};

// Opens `uri` in an editor but prevents opening multiple editors.
export async function openDocument(uri: vscode.Uri, options?: vscode.TextDocumentShowOptions): Promise<vscode.TextEditor> {
  const alreadyOpenEditor = vscode.window.visibleTextEditors.find(
    editor => editor.document.uri.toString() === uri.toString());

  const editor = await vscode.window.showTextDocument(uri, {
    viewColumn: alreadyOpenEditor && alreadyOpenEditor.viewColumn,
    preview: false,
    ...options
  });

  return editor;
}

let lastSelection: vscode.Uri | undefined;

export function pickMacroFile(macroFiles: Record<string, vscode.Uri[]>, options?: OpenMacroOptions): Promise<vscode.Uri | undefined> {
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
        },);
    }

    const quickPick = vscode.window.createQuickPick<UriQuickPickItem>();
    quickPick.placeholder = 'Select a macro…';
    quickPick.items = items;
    quickPick.onDidTriggerItemButton((e) => e.item.uri && openDocument(e.item.uri));
    return quickPick;
  }

  function createMacroFileItems(openFileButton?: { iconPath: vscode.ThemeIcon; tooltip: string; }) {
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
          buttons: openFileButton && [openFileButton],
          label: root ? relative(root, uri.fsPath) : vscode.workspace.asRelativePath(uri),
          uri,
        } as UriQuickPickItem))
          .sort((t1, t2) => t1.label.localeCompare(t2.label)));
      });
    return items;
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
