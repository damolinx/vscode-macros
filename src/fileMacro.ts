import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { Macro, MacroCode } from './macro';
import { parseOptions } from './macroOptions';

export class FileMacro implements Macro {
  public readonly shortName: string;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    this.shortName = basename(uri.fsPath, extname(uri.fsPath));
    this.uri = uri;
  }

  public async getCode(): Promise<MacroCode> {
    const openDocument = await vscode.workspace.openTextDocument(this.uri);
    const code = openDocument.getText();
    return { code, options: parseOptions(code) };
  }
}
