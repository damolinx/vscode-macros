import * as vscode from 'vscode';
import { extname } from 'path';
import { pickMacroFile } from '../common/ui';
import { expandPath } from '../common/variables';

export async function getMacroFromSourceDirs(): Promise<vscode.Uri | undefined> {
  const sourceDirectories = vscode.workspace.getConfiguration().get<string[]>('macros.sourceDirectories', []);
  if (sourceDirectories.length === 0) {
    vscode.window.showInformationMessage('No configured source directories');
    return;
  }

  const macroFiles = await findMacroFiles(
    sourceDirectories
      .map((path) => expandPath(path.trim()))
      .filter((path): path is string => !!path));
  if (Object.keys(macroFiles).length === 0) {
    vscode.window.showInformationMessage('No macro files in configured source directories');
    return;
  }

  const targetUri = await pickMacroFile(macroFiles);
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