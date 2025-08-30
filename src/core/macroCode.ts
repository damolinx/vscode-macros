import * as vscode from 'vscode';
import { Lazy } from '../utils/lazy';
import { getMacroId, MacroId } from './macroId';
import { MacroOptions, parseOptions } from './macroOptions';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly code: string;
  public readonly languageId: string;
  public readonly macroId: MacroId;
  public readonly version: number;

  constructor(document: vscode.TextDocument, macroId = getMacroId(document.uri)) {
    this._options = new Lazy(() => parseOptions(this.code));
    this.code = document.getText();
    this.languageId = document.languageId;
    this.macroId = macroId;
    this.version = document.version;
  }

  public isCurrentForAny(document: vscode.TextDocument): boolean {
    return this.macroId === getMacroId(document.uri) && this.isCurrentForKnown(document);
  }

  public isCurrentForKnown(document: vscode.TextDocument): boolean {
    return this.languageId === document.languageId && this.version === document.version;
  }

  public get options(): MacroOptions {
    return this._options.get();
  }
}
