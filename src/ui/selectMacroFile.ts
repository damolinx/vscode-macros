import * as vscode from 'vscode';
import { extname, sep } from 'path';
import { showMacroOpenDialog } from './dialogs';
import { OpenMacroOptions, pickMacroFile, UriQuickPickItem } from './ui';
import { MACRO_EXTENSIONS } from '../core/constants';
import { expandPath } from '../utils/variables';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export function getSourceDirectories(): vscode.Uri[] {
  const sourceDirectories = vscode.workspace.getConfiguration().get<string[]>(SOURCE_DIRS_CONFIG, []);
  return sourceDirectories
    .map((path) => expandPath(path.trim()))
    .filter((path): path is string => !!path)
    .map(sourceDirectory => vscode.Uri.file(sourceDirectory.endsWith(sep) ? sourceDirectory : (sourceDirectory + sep)));
}

export async function selectMacroFile(options?: OpenMacroOptions): Promise<vscode.Uri | undefined> {
  let macroFiles: Record<string, vscode.Uri[]> = {};

  const sourceDirectories = getSourceDirectories();
  if (sourceDirectories.length) {
    macroFiles = await findMacroFiles(sourceDirectories);
  }

  const targetUri = Object.keys(macroFiles).length
    ? await pickMacroFile(macroFiles, options)
    : !options?.hideOpen
      ? await showMacroOpenDialog()
      : undefined;
  if (!targetUri) {
    return; // No macro selected.
  }

  return targetUri;
}

export async function selectSourceDirectory(): Promise<vscode.Uri | undefined> {
  const sourceDirectories = getSourceDirectories();
  if (sourceDirectories.length === 0) {
    const OptionConfigure = 'Configure';
    const option = await vscode.window.showInformationMessage('No configured source directories', OptionConfigure);
    if (option === OptionConfigure) {
      await vscode.commands.executeCommand('macros.sourceDirectories.settings');
      return;
    }
  }

  const selectedItem = await vscode.window.showQuickPick<UriQuickPickItem>(
    sourceDirectories.map((d) => ({
      label: vscode.workspace.asRelativePath(d),
      uri: d,
    })).sort((t1, t2) => t1.label.localeCompare(t2.label)),
    {
      placeHolder: 'Select a macro source directory …',
    },
  );

  return selectedItem?.uri;
}

async function findMacroFiles(sourceDirectories: vscode.Uri[]): Promise<Record<string, vscode.Uri[]>> {
  const result = await Promise.all(
    sourceDirectories.map(async (sourceDirectory) => {
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(sourceDirectory);
      } catch (e) {
        if (!(e instanceof vscode.FileSystemError) || e.code !== 'FileNotFound') {
          throw e;
        }
        entries = [];
      }
      return [
        sourceDirectory.fsPath,
        filterReadDirectoryEntries(
          entries.filter(([_, type]) => type === vscode.FileType.File),
          sourceDirectory),
      ] as [string, vscode.Uri[]];
    }),
  );

  return Object.fromEntries(result.filter(([_root, files]) => files.length > 0));
}

export function filterReadDirectoryEntries(entries: [string, vscode.FileType][], sourceDirectory: vscode.Uri): vscode.Uri[] {
  return entries
    .filter(([path, _]) => MACRO_EXTENSIONS.includes(extname(path)))
    .map(([path, type]) =>
      type === vscode.FileType.File
        ? vscode.Uri.joinPath(sourceDirectory, path)
        : vscode.Uri.joinPath(sourceDirectory, path, sep));
}