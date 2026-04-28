import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { resolveMacroExt } from './macroLanguages';

export abstract class MacroBase<TId extends string> {
  private _name?: string;

  protected constructor(
    public readonly id: TId,
    public readonly uri: vscode.Uri,
  ) {}

  /**
   * Display name.
   */
  public get name(): string {
    this._name ??= uriBasename(this.uri, resolveMacroExt(this.uri) ?? true);
    return this._name;
  }
}
