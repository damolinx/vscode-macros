import * as vscode from 'vscode';

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