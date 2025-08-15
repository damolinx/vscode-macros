import * as vscode from 'vscode';
import { MACROS_FILTER } from '../core/constants';
import { saveTextEditor } from './vscodeEx';

export async function activeMacroEditor(ensureSaved: boolean): Promise<vscode.TextEditor | undefined> {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return editor; // No active editor.
  }

  if (editor.document.isDirty && ensureSaved) {
    editor = await saveTextEditor(editor, { filters: MACROS_FILTER });
  }
  return editor;
}
