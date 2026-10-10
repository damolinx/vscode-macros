import * as vscode from 'vscode';
import { createIdFromUri, Id } from '../../id';

export type CodeMacroId = Id<'macro.code'>;

export function getMacroId(uri: vscode.Uri): CodeMacroId {
  return createIdFromUri<CodeMacroId>(uri);
}
