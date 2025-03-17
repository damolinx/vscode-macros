import * as vscode from 'vscode';
import { basename, extname } from 'path';
import { Macro } from './macro';
import { MacroOptions, parseOptions } from './macroOptions';

export class FileMacro implements Macro {
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    this.uri = uri;
  }

  public async getCode(): Promise<string> {
    let code: string;
    const openDocument = await vscode.workspace.openTextDocument(this.uri);
    if (openDocument) {
      code = openDocument.getText();
    } else {
      const bytes = await vscode.workspace.fs.readFile(this.uri);
      code = bytes.toString();
    }
    return code;
  }

  public async getCodeAndOptions(): Promise<{ code: string; options: MacroOptions }> {
    const code = await this.getCode();
    return {
      code,
      options: parseOptions(code)
    };
  }

  public get shortName(): string {
    const path = this.uri.fsPath;
    return basename(path, extname(path));
  }
}
