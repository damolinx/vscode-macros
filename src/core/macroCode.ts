import * as vscode from 'vscode';
import { MacroOptions } from './macroOptions';
import { Lazy } from '../utils/lazy';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly code: string;

  constructor(document: vscode.TextDocument) {
    this._options = new Lazy(() => MacroCode.parseOptions(this.code));
    this.code = document.getText();
  }

  public get options(): Readonly<MacroOptions> {
    return this._options.get();
  }

  private static parseOptions(code: string): MacroOptions {
    const options: MacroOptions = {};
    for (const match of code.matchAll(/\/\/\s*@macro:\s*(?<option>\w+)\s*$/gm)) {
      if (match.groups?.option) {
        switch (match.groups.option) {
          case 'persistent':
            options.persistent = true;
            break;
          case 'singleton':
            options.singleton = true;
            break;
        }
      }
    }
    return options;
  }
}