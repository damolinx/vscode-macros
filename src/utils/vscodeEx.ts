import * as vscode from 'vscode';

// Saving an editor with an untitled document will return a new editor, which
// is confusing. This method will return the proper editor after saving.
export async function saveTextEditor(
  editor: vscode.TextEditor,
  optionsOrUri?: vscode.SaveDialogOptions | vscode.Uri,
): Promise<vscode.TextEditor | undefined> {
  let savedEditor: vscode.TextEditor | undefined;
  if (editor.document.isUntitled) {
    const targetUri =
      optionsOrUri instanceof vscode.Uri
        ? optionsOrUri
        : await vscode.window.showSaveDialog(optionsOrUri);
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

// Opens `uri` in an editor but prevents opening multiple editors.
export async function showTextDocument(
  uri: vscode.Uri,
  options?: vscode.TextDocumentShowOptions,
): Promise<vscode.TextEditor> {
  const alreadyOpenEditor = vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() === uri.toString(),
  );

  const editor = await vscode.window.showTextDocument(uri, {
    viewColumn: alreadyOpenEditor && alreadyOpenEditor.viewColumn,
    preview: false,
    ...options,
  });

  return editor;
}
