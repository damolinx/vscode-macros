
// Download https://github.com/Microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts
// and place it in the same directory as this file to get type information.

/** @typedef {import('./git').API} GitAPI */

async function main() {

  /** @type {GitAPI | undefined} */
  const git = vscode.extensions.getExtension('vscode.git')?.exports.getAPI(1);
  if (!git) {
    vscode.window.showErrorMessage('Git API not found');
    return;
  }

  const repo = git.repositories[0];
  if (!repo) {
    vscode.window.showErrorMessage('No Git repository found');
    return;
  }

  vscode.window.showInformationMessage(
    `Repository: ${require('path').basename(repo.rootUri.toString())}` +
    `\nBranch: ${repo.state.HEAD.name}` +
    `\nStaged changes: ${repo.state.indexChanges.length}` +
    `\nUnstaged changes: ${repo.state.workingTreeChanges.length}`,
    { modal: true });
}

main();
