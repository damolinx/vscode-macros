import * as vscode from 'vscode';
import { MacroPreferredSelector } from '../core/language';
import { MacroOptionType } from '../core/macroOptions';
import { ExtensionContext } from '../extensionContext';

export const MACRO_TRIGGER_CHARACTERS: readonly string[] = ['@'];
export const MACRO_OPTIONS_TRIGGER_CHARACTERS: readonly string[] = [':', ','];

export function registerMacroOptionsCompletionProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.languages.registerCompletionItemProvider(
      MacroPreferredSelector,
      new MacroOptionsCompletionProvider(),
      ...MACRO_TRIGGER_CHARACTERS,
      ...MACRO_OPTIONS_TRIGGER_CHARACTERS,
    ),
  );
}

const MACRO_OPTIONS_REGEX =
  /^\s*\/\/\s*@macro(?<separator>:?)(?<options>(?:\s*\w+\s*,)*\s*)(?<current>\w*)\s*$/d;
const MACRO_REGEX = /^\s*\/\/\s*(?<trigger>@)?\s*$/;

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
    let line: string;
    let match: RegExpMatchArray | null;
    let result: vscode.CompletionItem[] | undefined;

    switch (context.triggerKind) {
      case vscode.CompletionTriggerKind.Invoke:
        match = (line = getLine()).match(MACRO_OPTIONS_REGEX);
        if (match) {
          result = this.provideMacroOptionsCompletions(line, position, match);
        } else {
          match = line.match(MACRO_REGEX);
          if (match) {
            result = this.provideMacroCompletions(line, match);
          }
        }
        break;
      case vscode.CompletionTriggerKind.TriggerCharacter:
        if (MACRO_OPTIONS_TRIGGER_CHARACTERS.includes(context.triggerCharacter!)) {
          result = this.provideMacroOptionsCompletions(getLine(), position);
        } else if (MACRO_TRIGGER_CHARACTERS.includes(context.triggerCharacter!)) {
          result = this.provideMacroCompletions(getLine());
        }
        break;
    }

    return result;

    function getLine() {
      return document.lineAt(position).text.substring(0, position.character);
    }
  }

  private provideMacroCompletions(
    line: string,
    match = line.match(MACRO_REGEX),
  ): vscode.CompletionItem[] | undefined {
    if (!match) {
      return;
    }

    const macro = match.groups?.trigger ? 'macro' : '@macro';
    const macroItem = new vscode.CompletionItem('@macro', vscode.CompletionItemKind.Snippet);
    macroItem.command = {
      command: 'editor.action.triggerSuggest',
      title: 'Re-trigger suggestions',
    };
    macroItem.detail = 'Add comma-separated macro directives';
    macroItem.filterText = 'macro';
    macroItem.insertText = new vscode.SnippetString(`${macro}:$0`);
    return [macroItem];
  }

  private provideMacroOptionsCompletions(
    line: string,
    position: vscode.Position,
    match = line.match(MACRO_OPTIONS_REGEX),
  ): vscode.CompletionItem[] | undefined {
    if (!match) {
      return;
    }

    const { current, options, separator } = match.groups!;
    const availableMacroOptions = getAvailableOptions(options, current);
    if (availableMacroOptions.length === 0) {
      return;
    }

    const replaceRange = new vscode.Range(
      position.line,
      match.indices!.groups!.options[1],
      position.line,
      position.character,
    );

    return availableMacroOptions.map((opt) => {
      const item = new vscode.CompletionItem(opt, vscode.CompletionItemKind.Snippet);
      item.insertText = separator ? opt : `:${opt}`;
      item.range = replaceRange;

      switch (opt) {
        case 'persistent':
          item.detail = 'Share context across all instances';
          item.documentation =
            'All instances of this macro share the same execution context, ' +
            'allowing you to cache state or accumulate data over multiple runs.';
          break;
        case 'retained':
          item.detail = 'Prevent auto-termination';
          item.documentation =
            'Prevents the macro from auto-terminating at the end of the script. ' +
            'Use for long-lived services/providers without wrapping in a Promise.';
          break;
        case 'singleton':
          item.detail = 'Only one instance at a time';
          item.documentation =
            'Ensures only one instance of this macro runs concurrently. ' +
            'Additional invocations are rejected until it completes.';
          break;
      }

      return item;
    });

    function getAvailableOptions(optionsText = '', current = '') {
      const options: MacroOptionType[] = ['persistent', 'retained', 'singleton'];
      const usedOptions = optionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return usedOptions.length
        ? options.filter((o) => !usedOptions.includes(o) && o.startsWith(current))
        : options;
    }
  }
}
