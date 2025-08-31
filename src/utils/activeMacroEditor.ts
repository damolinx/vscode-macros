import * as vscode from 'vscode';
import { macroFilter } from './ui';
import { saveTextEditor } from './vscodeEx';

export async function activeMacroEditor(
  ensureSaved: boolean,
): Promise<vscode.TextEditor | undefined> {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return editor; // No active editor.
  }

  if (editor.document.isDirty && ensureSaved) {
    editor = await saveTextEditor(editor, { filters: macroFilter() });
  }
  return editor;
}
