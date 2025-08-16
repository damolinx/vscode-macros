import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { MacroCode } from './macroCode';
import { MacroOptions, parseOptions } from './macroOptions';

export type MacroId = string;

export function getMacroId(uri: vscode.Uri): string {
  return uri.toString(true);
}

export class Macro {
  private code?: string;
  private options?: MacroOptions;
  private version?: number;

  public readonly id: MacroId;
  public readonly name: string;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    this.id = getMacroId(uri);
    this.name = uriBasename(uri, true);
    this.uri = uri;
  }

  private async ensureCodeIsUpToDate(): Promise<boolean> {
    let updated = false;
    const document = await vscode.workspace.openTextDocument(this.uri);
    if (document.version !== this.version || !this.code) {
      this.code = document.getText();
      this.version = document.version;
      updated = true;
    }
    return updated;
  }

  public async getCode(): Promise<string> {
    await this.ensureCodeIsUpToDate();
    return this.code!;
  }

  public async getOptions(): Promise<Readonly<MacroCode['options']>> {
    if ((await this.ensureCodeIsUpToDate()) || !this.options) {
      this.options = parseOptions(this.code!);
    }
    return this.options;
  }
}
