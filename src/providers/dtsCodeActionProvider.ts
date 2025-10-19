import * as vscode from 'vscode';
import { MACRO_SELECTOR } from '../core/language';
import { ExtensionContext } from '../extensionContext';

export function registerDTSCodeActionProvider(context: ExtensionContext): void {
  context.extensionContext.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(MACRO_SELECTOR, new DTSCodeActionProvider()),
  );
}

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
    const downloadAction = new vscode.CodeAction('Download .d.ts file');
    downloadAction.command = {
      title: downloadAction.title,
      command: 'macros.downloadAsset',
      arguments: [vscode.Uri.parse(url), document.uri],
    };
    return [downloadAction];
  }
}
