import * as vscode from 'vscode';
import { showTextDocument } from './vscodeEx';
import { Runner } from '../execution/runner';
import { MacroOptions } from '../macroOptions';

export function showMacroErrorMessage(runner: Runner, macroOptions: MacroOptions, error: Error | string): Promise<void> {
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

  return showErrorMessage(runner, message, stack, selection);

  function filterStack(stack: string): string {
    const match = stack.match(/\n.+?vscode-macros/);
    return match ? stack.slice(0, match.index) : stack;
  }

  function parseStack(stack: string): vscode.Range | undefined {
    const firstMatch = stack.match(/.+?:(?<line>\d+)(:(?<offset>\d+))?$/m);
    let position: vscode.Position | undefined;
    if (firstMatch) {
      const { line, offset } = firstMatch.groups!;
      position = new vscode.Position(
        parseInt(line) - 1,
        offset ? (parseInt(offset) - 1) : 0);
    }
    return position && new vscode.Range(position, position);
  }

  async function showErrorMessage(runner: Runner, message: string, stack?: string, selection?: vscode.Range, modal = false): Promise<void> {
    const actions: { title: string; execute: () => Thenable<any> | void }[] = [
      {
        title: selection ? 'Go to Error Location' : 'Open Macro',
        execute: () => showTextDocument(runner.macro.uri, { selection }),
      },
      {
        title: 'Retry',
        execute: () => vscode.commands.executeCommand('macros.run', runner.macro.uri),
      },
    ];
    if (macroOptions.persistent) {
      actions.push({
        title: 'Reset Context',
        execute: () => runner.resetSharedContext(),
      });
    }

    const options: vscode.MessageOptions = {};
    if (stack) {
      if (modal) {
        options.detail = stack;
        options.modal = true;
      } else {
        actions.push({
          title: 'Details',
          execute: () => showErrorMessage(runner, message, stack, selection, true),
        });
      }
    }

    const action = await vscode.window.showErrorMessage(message, options, ...actions);
    if (action) {
      await action.execute();
    }
  }
}