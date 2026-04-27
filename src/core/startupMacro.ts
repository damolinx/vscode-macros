import * as vscode from 'vscode';
import { MacroBase } from './macroBase';
import {
  getMacroUriFromStartupMacroUri,
  getStartupMacroId,
  getStartupMacroUri,
  StartupMacroId,
} from './startupMacroId';

export class StartupMacro extends MacroBase<StartupMacroId> {
  private _macroUri?: vscode.Uri;

  constructor(
    uri: vscode.Uri,
    public readonly target: vscode.ConfigurationTarget,
  ) {
    const startupUri = getStartupMacroUri(uri);
    super(getStartupMacroId(startupUri), startupUri);
  }

  /**
   * Get target macro URI (i.e. not the `startup:` one).
   */
  public get macroUri(): vscode.Uri {
    this._macroUri ??= getMacroUriFromStartupMacroUri(this.uri);
    return this._macroUri;
  }
}
