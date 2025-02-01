import * as vscode from 'vscode';
import { showMacroSaveDialog } from './ui';
import { showTextDocument } from './vscodeEx';

export async function activeMacroEditor(ensureSaved: boolean): Promise<vscode.TextEditor | undefined> {
  let editor = vscode.window.activeTextEditor;
  if (!editor || !ensureSaved) {
    return editor;
  }

  const { document } = editor;
  if (document.isUntitled) {
    editor = await saveUntitled(editor);
  } else if (document.isDirty) {
    await document.save()
  }

  return editor;
}

// Saving an untitled document has a convoluted behavion in VS Code,
// so this isolates the right steps and return the new document. 
async function saveUntitled(editor: vscode.TextEditor): Promise<vscode.TextEditor | undefined> {
  let savedEditor: vscode.TextEditor | undefined;

  const targetUri = await showMacroSaveDialog();
  if (targetUri) {
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(editor.document.getText()));
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    savedEditor = await showTextDocument(targetUri);
  }

  return savedEditor;
}
