import * as vscode from 'vscode';
import { uriBasename } from '../utils/uri';
import { tryResolveMacroExt } from './language';
import {
  getMacroUriFromStartupMacroUri,
  getStartupMacroId,
  getStartupMacroUri,
  StartupMacroId,
} from './startupMacroId';

export class StartupMacro {
  public readonly id: StartupMacroId;
  public readonly macroUri: vscode.Uri;
  public readonly name: string;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    const startupUri = getStartupMacroUri(uri);
    this.id = getStartupMacroId(startupUri);
    this.macroUri = getMacroUriFromStartupMacroUri(uri);
    this.name = uriBasename(uri, tryResolveMacroExt(startupUri) ?? true);
    this.uri = startupUri;
  }
}
