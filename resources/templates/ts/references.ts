// @ts-nocheck
import * as vscode from 'vscode';

async function main(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor');
    return;
  }

  const { document: { uri }, selection: { active: position } } = editor;
  const references = await vscode.commands.executeCommand(
    'vscode.executeReferenceProvider', uri, position) as vscode.Location[];

  if (!references.length) {
    vscode.window.showInformationMessage('No references found');
    return;
  }

  const content = references
    .map(({ uri, range: { start } }) =>
      uri.with({ fragment: `${start.line + 1}:${start.character + 1}` }))
    .join('\n');

  const resultsDocument = await vscode.workspace.openTextDocument({ content });
  await vscode.window.showTextDocument(resultsDocument);
}

main();