import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { tryResolveMacroExt } from './language';
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
    this.name = uriBasename(this.uri, tryResolveMacroExt(this.uri) ?? true);

    if (!isUri) {
      this.code = new MacroCode(uriOrDocument, this.id);
    }
  }

  /**
   * Returns a {@link MacroCode} snapshot of the current state of the document
   * associated with this macro's {@link uri}. A new instance may be returned
   * if cached one is stale.
   */
  public async getCode(): Promise<MacroCode> {
    const document = await vscode.workspace.openTextDocument(this.uri);
    if (!this.code?.isCurrentForKnown(document)) {
      this.code = new MacroCode(document, this.id);
    }
    return this.code;
  }
}
