import * as vscode from 'vscode';
import { relative } from 'path';
import { NaturalComparer } from '../utils/ui';
import { areUriEqual, isUntitled, uriBasename } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';
import { showMacroOpenDialog } from './dialogs';

export interface OpenMacroOptions {
  hideOpen?: boolean;
  hideOpenPerItem?: boolean;
  selectUri?: vscode.Uri;
}

export interface UriQuickPickItem extends vscode.QuickPickItem {
  uri?: vscode.Uri;
}

const QuickPickOpenFile: vscode.QuickPickItem = {
  label: 'Open …',
  iconPath: new vscode.ThemeIcon('folder-opened'),
};

const QuickPickConfigureSourceDirectories: vscode.QuickPickItem = {
  label: 'Configure Source Directories …',
  iconPath: new vscode.ThemeIcon('gear'),
};

let lastSelection: vscode.Uri | undefined;

export async function pickMacroFile(
  macroFiles: vscode.Uri[] | Record<string, vscode.Uri[]>,
  options?: OpenMacroOptions,
): Promise<vscode.Uri | undefined> {
  const selection = await new Promise((resolve) => {
    const quickPick = createMacroQuickPick();
    const selectUri = options?.selectUri || lastSelection;
    if (selectUri) {
      const preselect = quickPick.items.find(({ uri }) => uri && areUriEqual(uri, selectUri));
      if (preselect) {
        quickPick.activeItems = [preselect];
      }
    }

    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
    quickPick.onDidAccept(async () => {
      const selectedItem = quickPick.selectedItems[0];
      resolve(selectedItem);
      quickPick.hide();
    });

    quickPick.show();
  });

  let uri: vscode.Uri | undefined;
  if (selection) {
    if (selection === QuickPickOpenFile) {
      uri = await showMacroOpenDialog();
    } else if (selection === QuickPickConfigureSourceDirectories) {
      uri = await vscode.commands.executeCommand('macros.sourceDirectories.settings');
    } else {
      uri = (selection as UriQuickPickItem).uri;
    }
    if (uri) {
      lastSelection = uri;
    }
  }

  return uri;

  function createMacroQuickPick(): vscode.QuickPick<UriQuickPickItem> {
    const openFileButton = options?.hideOpenPerItem
      ? undefined
      : {
          iconPath: new vscode.ThemeIcon('go-to-file'),
          tooltip: 'Open File',
        };
    const items: UriQuickPickItem[] = createMacroFileItems(openFileButton);
    if (!options?.hideOpen) {
      items.unshift(QuickPickOpenFile, QuickPickConfigureSourceDirectories, {
        label: '',
        kind: vscode.QuickPickItemKind.Separator,
      });
    }

    const quickPick = vscode.window.createQuickPick<UriQuickPickItem>();
    quickPick.items = items;
    quickPick.onDidTriggerItemButton(({ item: { uri } }) => uri && showTextDocument(uri));
    quickPick.placeholder = 'Select a macro';
    return quickPick;
  }

  function createMacroFileItems(openFileButton?: {
    iconPath: vscode.ThemeIcon;
    tooltip: string;
  }): UriQuickPickItem[] {
    const items = [] as UriQuickPickItem[];
    if (macroFiles instanceof Array) {
      items.push(...createItems(macroFiles));
    } else {
      Object.keys(macroFiles)
        .sort(NaturalComparer.compare)
        .forEach((root) => {
          items.push(
            { label: root, kind: vscode.QuickPickItemKind.Separator },
            ...createItems(macroFiles[root], root),
          );
        });
    }
    return items;

    function createItems(uris: vscode.Uri[], root?: string): UriQuickPickItem[] {
      return uris
        .map((uri) => ({
          buttons: openFileButton && [openFileButton],
          label: isUntitled(uri)
            ? uriBasename(uri)
            : root
              ? relative(root, uri.fsPath)
              : vscode.workspace.asRelativePath(uri),
          uri,
        }))
        .sort((t1, t2) => NaturalComparer.compare(t1.label, t2.label));
    }
  }
}

export function createGroupedQuickPickItems<TItem, TQuickPickItem extends vscode.QuickPickItem>(
  items: TItem[],
  options: {
    groupBy: (item: TItem) => string;
    itemBuilder: (item: TItem) => TQuickPickItem;
  },
): TQuickPickItem[] {
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

  const quickPickItems: TQuickPickItem[] = [];
  const sortedGroups = [...groups.keys()].sort(NaturalComparer.compare);
  for (const groupName of sortedGroups) {
    quickPickItems.push({
      label: groupName,
      kind: vscode.QuickPickItemKind.Separator,
    } as any);

    quickPickItems.push(
      ...groups
        .get(groupName)!
        .map(options.itemBuilder)
        .sort((a, b) => NaturalComparer.compare(a.label, b.label)),
    );
  }

  return quickPickItems;
}
