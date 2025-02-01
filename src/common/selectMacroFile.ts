import * as vscode from 'vscode';
import { extname } from 'path';
import { OpenMacroOptions, pickMacroFile, showMacroOpenDialog } from './ui';
import { expandPath } from './variables';

export async function selectMacroFile(options?: OpenMacroOptions): Promise<vscode.Uri | undefined> {
  let macroFiles: Record<string, vscode.Uri[]> = {};

  const sourceDirectories = vscode.workspace.getConfiguration().get<string[]>('macros.sourceDirectories', []);
  if (sourceDirectories.length) {
    macroFiles = await findMacroFiles(
      sourceDirectories
        .map((path) => expandPath(path.trim()))
        .filter((path): path is string => !!path));
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

async function findMacroFiles(sourceDirectories: string[]): Promise<Record<string, vscode.Uri[]>> {
  const result = await Promise.all(
    sourceDirectories.map(async (sourceDirectory) => {
      const uri = vscode.Uri.file(sourceDirectory);
      const entries = await vscode.workspace.fs.readDirectory(uri);
      return [
        sourceDirectory,
        entries
          .filter(([path, type]) => type === vscode.FileType.File && extname(path) === '.js')
          .map(([path, _]) => vscode.Uri.joinPath(uri, path))
      ] as [string, vscode.Uri[]];
    }),
  );

  return Object.fromEntries(result.filter(([_root, files]) => files.length > 0));
}