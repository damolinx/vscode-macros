import * as vscode from 'vscode';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroCode } from '../core/macroCode';
import { cleanError } from '../utils/errors';
import { TranspilationError } from '../utils/typescript';
import { showTextDocument } from '../utils/vscodeEx';

export function showMacroErrorMessage(
  runner: MacroRunner,
  macroCode: MacroCode,
  error: Error | string,
): Promise<void> {
  let message: string;
  let errorPos: vscode.Position | undefined;
  let filteredStack: string | undefined;

  if (typeof error === 'string') {
    message = error;
  } else {
    if (error instanceof TranspilationError) {
      message = error.message;
      errorPos = findTranspilationErrorPos(error);
    } else {
      const displayError = cleanError(error);
      message = displayError.message;
      if (displayError.stack) {
        filteredStack = displayError.stack;
        errorPos = findErrorPos(filteredStack);
      }
    }
  }

  return showErrorMessage(
    runner,
    macroCode,
    `Macro Error — ${message}`,
    filteredStack,
    errorPos && new vscode.Range(errorPos, errorPos),
  );

  function findTranspilationErrorPos(error: TranspilationError): vscode.Position | undefined {
    const first = error.diagnostics[0];

    let position: vscode.Position | undefined;
    if (first?.file && first.start !== undefined) {
      const { line, character } = first.file.getLineAndCharacterOfPosition(first.start);
      position = new vscode.Position(line, character);
    }

    return position;
  }

  function findErrorPos(stack: string): vscode.Position | undefined {
    let firstMatch: RegExpMatchArray | undefined;
    if (!firstMatch) {
      firstMatch = stack.match(/.+?:(?<line>\d+)(:(?<offset>\d+))?$/m) ?? undefined;
    }

    let position: vscode.Position | undefined;
    if (firstMatch) {
      const { line, offset } = firstMatch.groups!;
      position = new vscode.Position(parseInt(line) - 1, offset ? parseInt(offset) - 1 : 0);
    }
    return position;
  }
}

async function showErrorMessage(
  runner: MacroRunner,
  macroCode: MacroCode,
  message: string,
  stack?: string,
  errorLocation?: vscode.Range,
  modal = false,
): Promise<void> {
  const actions: { title: string; execute: () => Thenable<any> | void }[] = [
    {
      title: errorLocation ? 'Go to Error Location' : 'Open Macro',
      execute: () => showTextDocument(runner.macro.uri, { selection: errorLocation }),
    },
  ];

  if (!macroCode.options.singleton || runner.runInstanceCount === 0) {
    actions.push({
      title: 'Retry',
      execute: () => vscode.commands.executeCommand('macros.run', runner.macro.uri),
    });
  }

  if (macroCode.options.persistent) {
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
        execute: () => showErrorMessage(runner, macroCode, message, stack, errorLocation, true),
      });
    }
  }

  const action = await vscode.window.showErrorMessage(message, options, ...actions);
  if (action) {
    await action.execute();
  }
}
