import * as vscode from 'vscode';
import { MacroOptions } from './macroOptions';

export type MacroId = string;

export function getId(uri: vscode.Uri): MacroId {
  return uri.toString(true);
}

export interface MacroCode {
  readonly code: string;
  readonly options: Readonly<MacroOptions>;
}

export interface Macro {
  getCode(): Promise<MacroCode> | MacroCode;
  readonly shortName: string;
  readonly uri: vscode.Uri;
}
