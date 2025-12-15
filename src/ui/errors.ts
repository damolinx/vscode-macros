import * as vscode from 'vscode';
import { SandboxExecutor } from '../core/execution/executors/sandboxExecutor';
import { MacroCode } from '../core/macroCode';
import { cleanError } from '../utils/errors';
import { TranspilationError } from '../utils/typescript';
import { uriBasename } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

export function showMacroErrorMessage(
  executor: SandboxExecutor,
  macroCode: MacroCode,
  error: Error | string,
): Promise<void> {
  let message: string;
  let errorLocation:
    | {
        uri: vscode.Uri;
        range?: vscode.Range;
      }
    | undefined;
  let filteredStack: string | undefined;

  if (typeof error === 'string') {
    message = error;
  } else {
    if (error instanceof TranspilationError) {
      message = error.message;
      errorLocation = findTranspilationErrorPos(error);
    } else {
      const displayError = cleanError(error);
      message = displayError.message;
      if (displayError.stack) {
        filteredStack = displayError.stack;
        errorLocation = findErrorLocation(filteredStack, macroCode.languageId);
      }
    }
  }

  return showErrorMessage(
    executor,
    macroCode,
    `Macro Error — ${message}`,
    filteredStack,
    errorLocation,
  );

  function findTranspilationErrorPos(
    error: TranspilationError,
  ): { uri: vscode.Uri; range?: vscode.Range } | undefined {
    const first = error.diagnostics[0];

    const location: { uri: vscode.Uri; range?: vscode.Range } = {
      uri: executor.macro.uri,
    };
    if (first?.file && first.start !== undefined) {
      const { line, character } = first.file.getLineAndCharacterOfPosition(first.start);
      location.range = new vscode.Range(line, character, line, character);
    }

    return location;
  }

  function findErrorLocation(
    stack: string,
    language: string,
  ): { uri: vscode.Uri; range?: vscode.Range } | undefined {
    let location: { uri: vscode.Uri; range?: vscode.Range } | undefined;

    const regex =
      language === 'typescript'
        ? /at\s+(?<prefix>.+?):(?<line>\d+)(:(?<offset>\d+))?(?:\)|$)/m
        : /(?<prefix>.+?):(?<line>\d+)(:(?<offset>\d+))?(?:\)|$)/m;

    const firstMatch = stack.match(regex);
    if (firstMatch) {
      const { prefix, line, offset } = firstMatch.groups!;
      const position = new vscode.Position(parseInt(line) - 1, offset ? parseInt(offset) - 1 : 0);
      if (prefix.endsWith(uriBasename(executor.macro.uri))) {
        location = {
          uri: executor.macro.uri,
          range: new vscode.Range(position, position),
        };
      } else {
        try {
          const parsedUri = vscode.Uri.parse(prefix, true);
          location = {
            uri: parsedUri,
            range: new vscode.Range(position, position),
          };
        } catch {
          // eslint-disable no-empty
        }
      }
    }

    return location;
  }
}

async function showErrorMessage(
  executor: SandboxExecutor,
  macroCode: MacroCode,
  message: string,
  stack?: string,
  errorLocation?: {
    uri: vscode.Uri;
    range?: vscode.Range;
  },
  modal = false,
): Promise<void> {
  const actions: { title: string; execute: () => Thenable<any> | void }[] = [
    errorLocation
      ? {
          title: 'Go to Error Location',
          execute: () => showTextDocument(errorLocation.uri, { selection: errorLocation?.range }),
        }
      : {
          title: 'Open Macro',
          execute: () => showTextDocument(executor.macro.uri),
        },
  ];

  if (!macroCode.options.singleton || executor.executionCount === 0) {
    actions.push({
      title: 'Retry',
      execute: () =>
        vscode.commands.executeCommand('macros.run', executor.macro.uri, {
          ignoreDiagnosticErrors: true,
        }),
    });
  }

  if (macroCode.options.persistent) {
    actions.push({
      title: 'Reset Context',
      execute: () => executor.resetSharedContext(),
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
        execute: () =>
          showErrorMessage(executor, macroCode, 'Macro Error', stack, errorLocation, true),
      });
    }
  }

  const action = await vscode.window.showErrorMessage(message, options, ...actions);
  if (action) {
    await action.execute();
  }
}
