import * as vscode from 'vscode';
import { MacroBase } from './macro';
import {
  getMacroUriFromStartupMacroUri,
  getStartupMacroId,
  getStartupMacroUri,
  StartupMacroId,
} from './startupMacroId';

export class StartupMacro extends MacroBase<StartupMacroId> {
  public _macroUri?: vscode.Uri;
  public target: vscode.ConfigurationTarget;

  constructor(uri: vscode.Uri, target: vscode.ConfigurationTarget) {
    const startupUri = getStartupMacroUri(uri);
    super(startupUri, getStartupMacroId(startupUri));
    this.target = target;
  }

  /**
   * Get target macro URI (i.e. not the `startup:` one).
   */
  public get macroUri(): vscode.Uri {
    this._macroUri ??= getMacroUriFromStartupMacroUri(this.uri);
    return this._macroUri;
  }
}
