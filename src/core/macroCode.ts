import * as vscode from 'vscode';
import { MacroOptions, parseOptions } from './macroOptions';
import { Lazy } from '../utils/lazy';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly code: string;

  constructor(document: vscode.TextDocument) {
    this._options = new Lazy(() => parseOptions(this.code));
    this.code = document.getText();
  }

  public get options(): Readonly<MacroOptions> {
    return this._options.get();
  }
}