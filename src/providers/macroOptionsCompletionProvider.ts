import * as vscode from 'vscode';

export const MACRO_TRIGGER_CHARACTERS = ['@', ':'];

/**
 * Provide autocompletion for `@macro` options.
 */
export class MacroOptionsCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[] | undefined> {
    const line = document.lineAt(position).text.substring(0, position.character);

    if (context.triggerCharacter === '@') {
      if (/^\s*\/\/\s*@/.test(line)) {
        const macroItem = new vscode.CompletionItem('@macro', vscode.CompletionItemKind.Snippet);
        macroItem.filterText = 'macro';
        macroItem.insertText = 'macro';
        return [macroItem];
      }
    } else if (context.triggerCharacter === ':' || context.triggerKind == vscode.CompletionTriggerKind.Invoke) {
      if (/^\s*\/\/\s*@macro:/.test(line)) {
        const persistentItem = new vscode.CompletionItem('persistent', vscode.CompletionItemKind.Snippet);
        persistentItem.documentation = 'All instances of this macro share the same context.';
        const singletonItem = new vscode.CompletionItem('singleton', vscode.CompletionItemKind.Snippet);
        singletonItem.documentation = 'Only one instance of the macro can be active at a time.';
        return [persistentItem, singletonItem];
      }
    }

    return;
  }
}