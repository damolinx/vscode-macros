import * as vscode from 'vscode';
import { MACROS_FILTER } from '../common/ui';

export async function getActiveMacroEditorUri(): Promise<vscode.Uri | undefined> {
  let uri: vscode.Uri | undefined;
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const { document } = editor;
    if (document.isUntitled) {
      const savedDocument = await saveUntitled(document);
      uri = savedDocument?.uri;
    } else if (!document.isDirty || await document.save()) {
      uri = document.uri;
    }
  }

  return uri;
}

// Saving an untitled document has a convoluted behavion in VS Code,
// so this isolates the right steps and return the new document. 
async function saveUntitled(document: vscode.TextDocument): Promise<vscode.TextDocument | undefined> {
  let savedDocument: vscode.TextDocument | undefined;

  const targetUri = await vscode.window.showSaveDialog({
    filters: MACROS_FILTER
  });

  if (targetUri) {
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(document.getText()));
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    const savedEditor = await vscode.window.showTextDocument(targetUri, { preview: false });
    savedDocument = savedEditor.document;
  }

  return savedDocument;
}
