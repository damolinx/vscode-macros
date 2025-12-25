import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { tryResolveMacroExt } from './language';
import { MacroCode } from './macroCode';
import { getMacroId, MacroId } from './macroId';

export class Macro {
  private _name?: string;
  private code?: MacroCode;
  public readonly id: MacroId;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri, id = getMacroId(uri)) {
    this.id = id;
    this.uri = uri;
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

  /**
   * Returns this macro’s display name.
   */
  public get name(): string {
    this._name ??= uriBasename(this.uri, tryResolveMacroExt(this.uri) ?? true);
    return this._name;
  }
}
