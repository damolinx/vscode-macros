import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { MacroCode } from './macroCode';
import { getMacroId, MacroId } from './macroId';

export class Macro {
  private code?: MacroCode;
  public readonly id: MacroId;
  public readonly name: string;
  public readonly uri: vscode.Uri;

  constructor(uriOrDocument: vscode.Uri | vscode.TextDocument, id?: MacroId) {
    const isUri = uriOrDocument instanceof vscode.Uri;
    this.uri = isUri ? uriOrDocument : uriOrDocument.uri;
    this.id = id ?? getMacroId(this.uri);
    this.name = uriBasename(this.uri, true);

    if (!isUri) {
      this.code = new MacroCode(uriOrDocument, this.id);
    }
  }

  public async getCode(): Promise<MacroCode> {
    const document = await vscode.workspace.openTextDocument(this.uri);
    if (!this.code?.isCurrentForKnown(document)) {
      this.code = new MacroCode(document, this.id);
    }
    return this.code;
  }
}
