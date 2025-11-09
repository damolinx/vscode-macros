import * as vscode from 'vscode';
import { MacroPreferredSelector } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';

export const EXECUTE_COMMAND_CHARACTERS: readonly string[] = ['(', '"', "'", '`'];

export function registerExecuteCommandCompletionProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.languages.registerCompletionItemProvider(
      MacroPreferredSelector,
      new ExecuteCommandCompletionProvider(),
      ...EXECUTE_COMMAND_CHARACTERS,
    ),
  );
}

/**
 * Provide autocompletion for `executeCommand`.
 */
export class ExecuteCommandCompletionProvider
  implements vscode.Disposable, vscode.CompletionItemProvider {
  private readonly commandIds: Lazy<Thenable<string[]>>;
  private readonly disposables: vscode.Disposable[];

  constructor() {
    this.commandIds = new Lazy(() => vscode.commands.getCommands(true));
    this.disposables = [vscode.extensions.onDidChange(() => this.commandIds.reset())];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[] | undefined> {
    const line = document.lineAt(position).text.substring(0, position.character);
    const match = line.match(
      /(?:^\s*\.?|\.)executeCommand\s*\(\s*(?:(?<quote>["'`])[a-zA-Z0-9._-]*|\1?)$/,
    );
    if (!match) {
      return;
    }

    const commandIds = await this.commandIds.get();
    const quote = match.groups?.quote;
    const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9._-]+/);

    return commandIds.map((id) => {
      const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Value);
      item.range = range;
      if (!quote) {
        item.insertText = `'${id}'`;
      }
      return item;
    });
  }
}
