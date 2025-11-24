
async function main() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor');
    return;
  }

  const { document: { uri }, selection: { active: position } } = editor;

  /** @type {import('vscode').Location[] | undefined} */
  const references = await vscode.commands.executeCommand(
    'vscode.executeReferenceProvider', uri, position);

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