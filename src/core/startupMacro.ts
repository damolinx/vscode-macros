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

  constructor(uri: vscode.Uri) {
    const startupUri = getStartupMacroUri(uri);
    super(startupUri, getStartupMacroId(startupUri));
  }

  public get macroUri(): vscode.Uri {
    this._macroUri ??= getMacroUriFromStartupMacroUri(this.uri);
    return this._macroUri;
  }
}
