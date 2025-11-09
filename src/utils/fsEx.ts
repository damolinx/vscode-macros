import * as vscode from 'vscode';

export function existsDirectory(uri: vscode.Uri): Promise<boolean> {
  return exists(uri, vscode.FileType.Directory);
}

export function existsFile(uri: vscode.Uri): Promise<boolean> {
  return exists(uri, vscode.FileType.File, vscode.FileType.SymbolicLink);
}

export async function exists(uri: vscode.Uri, ...types: vscode.FileType[]): Promise<boolean> {
  const stat = await fsStat(uri);
  return !!stat && (types.length === 0 || types.includes(stat.type));
}

export async function fsType(uri: vscode.Uri): Promise<vscode.FileType | undefined> {
  const stat = await fsStat(uri);
  return stat?.type;
}

export async function fsStat(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
  return vscode.workspace.fs.stat(uri).then(
    (s) => s,
    () => undefined,
  );
}
