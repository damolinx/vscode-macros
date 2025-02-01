import * as vscode from 'vscode';

// Saving an editor with an untitled document might will a new editor, which is
// confusing. This method will return the proper editor after saving.  
export async function saveTextEditor(editor: vscode.TextEditor, options?: vscode.SaveDialogOptions): Promise<vscode.TextEditor | undefined> {
  let savedEditor: vscode.TextEditor | undefined;
  if (editor.document.isUntitled) {
    const targetUri = await vscode.window.showSaveDialog(options);
    if (targetUri) {
      await vscode.workspace.fs.writeFile(targetUri, Buffer.from(editor.document.getText()));
      await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
      savedEditor = await showTextDocument(targetUri);
    }
  } else {
    await editor.document.save();
    savedEditor = editor;
  }

  return savedEditor;
}

export function setContext<T>(name: string, value: T): Thenable<void> {
  return vscode.commands.executeCommand('setContext', `macros:${name}`, value);
}

// Opens `uri` in an editor but prevents opening multiple editors.
export async function showTextDocument(uri: vscode.Uri, options?: vscode.TextDocumentShowOptions): Promise<vscode.TextEditor> {
  const alreadyOpenEditor = vscode.window.visibleTextEditors.find(
    editor => editor.document.uri.toString() === uri.toString());

  const editor = await vscode.window.showTextDocument(uri, {
    viewColumn: alreadyOpenEditor && alreadyOpenEditor.viewColumn,
    preview: false,
    ...options
  });

  return editor;
}

export class UriHelpers {
  public static toPath(pathOrUri: string | vscode.Uri): string {
    return pathOrUri instanceof vscode.Uri ? pathOrUri.fsPath : pathOrUri;
  }

  public static toUri(pathOrUri: string | vscode.Uri): vscode.Uri {
    return pathOrUri instanceof vscode.Uri ? pathOrUri : vscode.Uri.file(pathOrUri);
  }
}