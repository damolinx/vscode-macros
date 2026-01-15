import * as vscode from 'vscode';
import { FeatureEnabledSelector } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { Lazy } from '../utils/lazy';

export const EXECUTE_COMMAND_CHARACTERS: readonly string[] = ['(', '"', "'", '`'];

export function registerExecuteCommandCompletionProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.languages.registerCompletionItemProvider(
      FeatureEnabledSelector,
      new ExecuteCommandCompletionProvider(),
      ...EXECUTE_COMMAND_CHARACTERS,
    ),
  );
}

interface CommandMetadata {
  command: string;
  extensionName?: string;
  title?: string;
}

/**
 * Provide autocompletion for `executeCommand`.
 */
export class ExecuteCommandCompletionProvider
  implements vscode.Disposable, vscode.CompletionItemProvider {
  private readonly commandMetadata: Lazy<Promise<readonly CommandMetadata[]>>;
  private readonly disposables: vscode.Disposable[];

  constructor() {
    this.commandMetadata = new Lazy(() => this.loadCommandMetadata());
    this.disposables = [vscode.extensions.onDidChange(() => this.commandMetadata.reset())];
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
      /(?:^\s*\.?|\.)executeCommand\s*\(\s*(?:(?<quote1>["'`])[a-zA-Z0-9._-]*|(?<quote2>["'`])?)$/,
    );
    if (!match) {
      return;
    }

    const quote = match.groups?.quote1 || match.groups?.quote2;
    const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9._-]+/);

    const commandMetadata = await this.commandMetadata.get();
    return commandMetadata.map(({ command: id, extensionName, title }) => {
      const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Value);
      item.detail = extensionName ? `${title ?? ''} [${extensionName}]` : title;
      item.range = range;
      if (!quote) {
        item.insertText = `'${id}'`;
      }
      return item;
    });
  }

  private async loadCommandMetadata(): Promise<readonly CommandMetadata[]> {
    const cmd2Metadata = new Map<string, CommandMetadata>();
    for (const { packageJSON } of vscode.extensions.all) {
      const cmds: CommandMetadata[] = packageJSON?.contributes?.commands;
      if (cmds) {
        const extensionName: string | undefined = packageJSON.displayName ?? packageJSON.name;
        cmds.forEach((m) => cmd2Metadata.set(m.command, { ...m, extensionName }));
      }
    }

    const cmdMetadata: CommandMetadata[] = [];
    for (const command of await vscode.commands.getCommands(true)) {
      const metadata = cmd2Metadata.get(command);
      cmdMetadata.push(metadata ?? { command });
    }

    return Object.freeze(cmdMetadata);
  }
}
