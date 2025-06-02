import * as vscode from 'vscode';
import { relative } from 'path';
import { showMacroOpenDialog } from './dialogs';
import { showTextDocument } from '../utils/vscodeEx';

export interface OpenMacroOptions {
  hideOpen?: boolean;
  hideOpenPerItem?: boolean
}

export interface UriQuickPickItem extends vscode.QuickPickItem {
  uri?: vscode.Uri
}

const QuickPickOpenFile: vscode.QuickPickItem = {
  label: 'Open File …',
  iconPath: new vscode.ThemeIcon('folder-opened'),
};

const QuickPickConfigureSourceDirectories: vscode.QuickPickItem = {
  label: 'Configure Source Directories …',
  iconPath: new vscode.ThemeIcon('gear'),
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
      }
      else if (selectedItem === QuickPickConfigureSourceDirectories) {
        uri = await vscode.commands.executeCommand('macros.sourceDirectories.settings');
      }
      else {
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
      items.unshift(
        QuickPickOpenFile,
        QuickPickConfigureSourceDirectories,
        {
          label: '',
          kind: vscode.QuickPickItemKind.Separator,
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

export function createGroupedQuickPickItems<
  TItem,
  TQuickPick extends vscode.QuickPickItem>(
    items: TItem[],
    options: {
      groupBy: (item: TItem) => string,
      itemBuilder: (item: TItem) => TQuickPick,
    }): TQuickPick[] {

  const groups = new Map<string, TItem[]>();
  for (const item of items) {
    const groupName = options.groupBy(item);
    let group = groups.get(groupName);
    if (!group) {
      group = [];
      groups.set(groupName, group);
    }
    group.push(item);
  }

  const quickPickItems: TQuickPick[] = [];
  const sortedGroups = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  for (const groupName of sortedGroups) {

    quickPickItems.push(({
      label: groupName,
      kind: vscode.QuickPickItemKind.Separator,
    } as any));

    quickPickItems.push(...
      groups.get(groupName)!
        .map(options.itemBuilder)
        .sort((a, b) => a.label.localeCompare(b.label)));
  }

  return quickPickItems;
}
