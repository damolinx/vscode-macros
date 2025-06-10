import * as vscode from 'vscode';
import { posix } from 'path';
import { MACRO_EXTENSIONS } from '../constants';

export class MacroLibrary {
  public readonly root: vscode.Uri;

  constructor(root: vscode.Uri) {
    this.root = root;
  }

  public async getFiles(): Promise<vscode.Uri[]> {
    const entries = await (vscode.workspace.fs.readDirectory(this.root)
      .then((entries) => entries, (_error) => []));
    return entries
      .filter(([name, type]) =>
        (type === vscode.FileType.File || type === vscode.FileType.SymbolicLink) &&
        MACRO_EXTENSIONS.includes(posix.extname(name)))
      .map(([name, _]) => vscode.Uri.joinPath(this.root, name, posix.sep));
  }
}