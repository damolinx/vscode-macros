import * as vscode from 'vscode';

export async function exists(uri: vscode.Uri, type?: vscode.FileType): Promise<boolean> {
  const uriType = await getFileType(uri);
  if (!uriType) {
    return false;
  }

  return type !== undefined ? (uriType & type) !== 0 : true;
}

export async function getFileType(uri: vscode.Uri): Promise<vscode.FileType | undefined> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type;
  } catch {
    return undefined;
  }
}
