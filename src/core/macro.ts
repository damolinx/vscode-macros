import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { MacroCode } from './macroCode';
import { getMacroId, MacroId } from './macroId';
import { resolveMacroExt } from './macroLanguages';

export abstract class MacroBase<TId extends string> {
  private _name?: string;
  public readonly id: TId;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri, id: TId) {
    this.id = id;
    this.uri = uri;
  }

  /**
   * Returns this macro’s display name.
   */
  public get name(): string {
    this._name ??= uriBasename(this.uri, resolveMacroExt(this.uri) ?? true);
    return this._name;
  }
}

export class Macro extends MacroBase<MacroId> {
  private code?: MacroCode;

  constructor(uri: vscode.Uri, id = getMacroId(uri)) {
    super(uri, id);
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
