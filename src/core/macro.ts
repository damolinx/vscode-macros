import * as vscode from 'vscode';
import { MacroBase } from './macroBase';
import { MacroCode } from './macroCode';
import { getMacroId, MacroId } from './macroId';

export class Macro extends MacroBase<MacroId> {
  private code?: MacroCode;

  constructor(uri: vscode.Uri, id = getMacroId(uri)) {
    super(id, uri);
  }

  /**
   * Returns the *current* document state for this macro. Successive calls may
   * return different instances.
   */
  public async getCode(): Promise<MacroCode> {
    const document = await vscode.workspace.openTextDocument(this.uri);
    if (this.code?.version !== document.version) {
      this.code = new MacroCode(document, this.id);
    }
    return this.code;
  }
}
