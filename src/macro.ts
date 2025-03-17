import * as vscode from 'vscode';
import { MacroOptions } from './macroOptions';

export type MacroId = string;

export function getId(uri: vscode.Uri): MacroId {
  return uri.toString(true);
}

export interface Macro {
  getCode(): string | Promise<string>;
  getCodeAndOptions(): { code: string; options: MacroOptions; } | Promise<{ code: string; options: MacroOptions; }>;
  readonly shortName: string;
  readonly uri: vscode.Uri;
}
