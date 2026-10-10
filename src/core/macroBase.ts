import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { Id } from './id';
import { resolveMacroInfo } from './macroLanguages';

export abstract class MacroBase<TId extends Id<string> = Id<string>> {
  private _name?: string;

  protected constructor(
    public readonly id: TId,
    public readonly uri: vscode.Uri,
  ) {}

  public get name(): string {
    this._name ??= uriBasename(this.uri, resolveMacroInfo(this.uri)?.extension ?? true);
    return this._name;
  }
}
