/** @returns {Promise<Array<InstanceType<typeof vscode.Location>> | undefined> } */
async function getReferences() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { document, selection: { active: position } } = editor;

  /** @type {Array<InstanceType<typeof vscode.Location>>} */
  const references = await vscode.commands.executeCommand(
    'vscode.executeReferenceProvider',
    editor.document.uri,
    position
  );

  return references;
}

getReferences().then((refs) => {
  if (!refs?.length) {
    vscode.window.showInformationMessage(refs ? "No references found" : "No active editor");
  } else {
    const content = refs
      .map(({ uri, range: { start } }) => uri.with({ fragment: `${start.line + 1}:${start.character + 1}` }).toString(true))
      .join("\n");
    vscode.workspace.openTextDocument({ content })
      .then(vscode.window.showTextDocument);
  }
});