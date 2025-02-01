import * as vscode from 'vscode';
import { Macro } from '../macro';
import { showTextDocument } from './vscodeEx';

export function showMacroErrorMessage(macro: Macro, error: Error | string): Promise<void> {
  let message: string;
  let selection: vscode.Range | undefined;
  let stack: string | undefined;

  if (typeof error === 'string') {
    message = error;
  } else {
    message = error.message;
    if (error.stack) {
      stack = filterStack(error.stack);
      selection = parseStack(stack);
    }
  }

  return showErrorMessage(macro, message, stack, selection);

  function filterStack(stack: string): string {
    const match = stack.match(/\n.+?vscode-macros/);
    return match ? stack.slice(0, match.index) : stack;
  }

  function parseStack(stack: string): vscode.Range | undefined {
    const firstMatch = stack.match(/.+?(?<line>\d+)(:(?<offset>\d+))?$/m);
    let position: vscode.Position | undefined;
    if (firstMatch) {
      const { line, offset } = firstMatch.groups!;
      position = new vscode.Position(
        parseInt(line) - 1,
        offset ? (parseInt(offset) - 1) : 0);
    }
    return position && new vscode.Range(position, position);
  }

  async function showErrorMessage(macro: Macro, message: string, stack?: string, selection?: vscode.Range, modal = false): Promise<void> {
    const actions = [
      {
        title: "Open",
        execute: () => showTextDocument(macro.uri, { selection })
      },
      {
        title: "Retry",
        execute: () => vscode.commands.executeCommand('macros.run', macro.uri),
      },
    ];

    const options: vscode.MessageOptions = {};
    if (stack) {
      if (modal) {
        options.detail = stack;
        options.modal = true;
      } else {
        actions.push({
          title: "Details",
          execute: () => showErrorMessage(macro, message, stack, selection, true),
        });
      }
    }

    const action = await vscode.window.showErrorMessage(message, options, ...actions);
    if (action) {
      await action.execute();
    }
  }
}