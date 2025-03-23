import * as vscode from 'vscode';

/**
 * Provide autocompletion for `@macro` options.
 */
export class MacroOptionsCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | undefined> {
    const line = document.lineAt(position).text.substring(0, position.character);

    if (context.triggerCharacter === '@') {
      if (/^\s*\/\/\s*@/.test(line)) {
        return [
          new vscode.CompletionItem('macro', vscode.CompletionItemKind.Keyword)
        ];
      }
    } else if (context.triggerCharacter === ':' || context.triggerKind == vscode.CompletionTriggerKind.Invoke) {
      if (/^\s*\/\/\s*@macro:/.test(line)) {
        return [
          new vscode.CompletionItem('persistent', vscode.CompletionItemKind.Keyword),
          new vscode.CompletionItem('singleton', vscode.CompletionItemKind.Keyword)
        ];
      }
    }

    return;
  }
}