import * as vscode from 'vscode';
import { extname, sep } from 'path';
import { OpenMacroOptions, pickMacroFile, showMacroOpenDialog } from './ui';
import { expandPath } from './variables';
import { MACRO_EXTENSIONS } from '../constants';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export function getSourceDirectories(): vscode.Uri[] {
  const sourceDirectories = vscode.workspace.getConfiguration().get<string[]>(SOURCE_DIRS_CONFIG, []);
  return sourceDirectories
    .map((path) => expandPath(path.trim()))
    .filter((path): path is string => !!path)
    .map(sourceDirectory => vscode.Uri.file(sourceDirectory));
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
          sourceDirectory)
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