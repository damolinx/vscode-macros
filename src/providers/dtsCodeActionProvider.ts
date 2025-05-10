import * as vscode from 'vscode';

/**
 * Provides a code action to download .d.ts files locally.
 */
export class DTSCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    _context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const urlRange = document.getWordRangeAtPosition(range.start, /https?:\/\/[^\s]+\.d\.ts$/g);
    if (!urlRange) {
      return [];
    }

    const url = document.getText(urlRange);
    const downloadAction = new vscode.CodeAction(
      'Download .d.ts file',
      vscode.CodeActionKind.QuickFix,
    );
    downloadAction.command = {
      title: downloadAction.title,
      command: 'macros.downloadAsset',
      arguments: [url, document.uri],
    };
    return [downloadAction];
  }
}