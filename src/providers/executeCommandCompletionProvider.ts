import * as vscode from 'vscode';
import { Lazy } from '../common/lazy';

export const EXECUTE_COMMAND_CHARACTERS: readonly string[] = ['(', '"', '\'', '`'];

/**
 * Provide autocompletion for `executeCommand`.
 */
export class ExecuteCommandCompletionProvider implements vscode.Disposable, vscode.CompletionItemProvider {
  private readonly commandIds: Lazy<Thenable<string[]>>;
  private readonly disposables: vscode.Disposable[];

  constructor() {
    this.commandIds = new Lazy(() => vscode.commands.getCommands(true));
    this.disposables = [
      vscode.extensions.onDidChange(() => this.commandIds.reset()),
    ];
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
    const match = line.match(/(?:^\s*\.?|\.)executeCommand\s*\(\s*(?:(?<quote>["'`])[a-zA-Z0-9._-]*|(?<quote>["'`])?)$/);
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