import * as vscode from 'vscode';

export const MACRO_TRIGGER_CHARACTERS: readonly string[] = ['@', ':'];

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
        macroItem.detail = 'Add a macro directive';
        macroItem.filterText = 'macro';
        macroItem.insertText = new vscode.SnippetString('macro:${1}');
        macroItem.command = {
          command: 'editor.action.triggerSuggest',
          title: 'Re-trigger suggestions',
        };
        return [macroItem];
      }
    } else if (context.triggerCharacter === ':' || context.triggerKind == vscode.CompletionTriggerKind.Invoke) {
      if (/^\s*\/\/\s*@macro:/.test(line)) {

        const persistentItem = new vscode.CompletionItem(
          'persistent',
          vscode.CompletionItemKind.Snippet,
        );
        persistentItem.detail = 'Share context across all instances';
        persistentItem.documentation = new vscode.MarkdownString(
          'All instances of this macro share the same execution context ' +
          'allowing you to cache state or accumulate data over multiple runs.',
        );

        const residentItem = new vscode.CompletionItem(
          'resident',
          vscode.CompletionItemKind.Snippet,
        );
        residentItem.detail = 'Prevent auto-termination';
        residentItem.documentation = new vscode.MarkdownString(
          'Prevents the macro from auto-terminating at the end of the script. ' +
          'Use this for long-lived VS Code services/providers (e.g.`onDidOpenTextDocument` listeners, language server sessions) ' +
          'without wrapping everything in a Promise.',
        );

        const singletonItem = new vscode.CompletionItem(
          'singleton',
          vscode.CompletionItemKind.Snippet,
        );
        singletonItem.detail = 'Only one instance at a time';
        singletonItem.documentation = new vscode.MarkdownString(
          'Ensures only one instance of this macro runs concurrently ' +
          'Additional invocations will be rejected until the current instance stops.',
        );

        return [persistentItem, residentItem, singletonItem];
      }
    }

    return;
  }
}