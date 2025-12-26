import * as vscode from 'vscode';
import { SandboxExecutionId } from '../core/execution/sandboxExecutionId';
import { ExtensionContext } from '../extensionContext';
import { cleanStack } from '../utils/errors';

/**
 * Log channel for macros. Wraps the extension's main logger to prepend
 * the macro run ID and prevent execution of unsafe operations.
 */
export class MacroLogOutputChannel implements vscode.LogOutputChannel {
  readonly #id: string;
  readonly #log: vscode.LogOutputChannel;

  constructor(executionId: SandboxExecutionId, { log }: ExtensionContext) {
    this.#log = log;
    this.#id = `[${executionId}]`;
  }

  #blocked(op: string) {
    this.warn(`Macro is not allowed to call \`${op}\`; ignoring call.`);
  }

  #prefix(message: string) {
    return `${this.#id} ${message}`;
  }

  get logLevel(): vscode.LogLevel {
    return this.#log.logLevel;
  }

  get name(): string {
    return this.#log.name;
  }

  get onDidChangeLogLevel(): vscode.Event<vscode.LogLevel> {
    return this.#log.onDidChangeLogLevel;
  }

  append(value: string): void {
    this.#log.append(value);
  }

  appendLine(value: string): void {
    this.#log.appendLine(value);
  }

  clear(): void {
    this.#blocked('clear');
  }

  debug(message: string, ...args: any[]): void {
    this.#log.debug(this.#prefix(message), ...args);
  }

  dispose(): void {
    this.#blocked('dispose');
  }

  error(error: string | Error, ...args: any[]): void {
    if (typeof error === 'string') {
      return this.#log.error(this.#prefix(error), ...args);
    }

    const withIdError = new Error(this.#prefix(error.message), { cause: error });
    withIdError.stack = error.stack && cleanStack(error.stack);
    this.#log.error(withIdError, ...args);
  }

  hide(): void {
    this.#log.hide();
  }

  info(message: string, ...args: any[]): void {
    this.#log.info(this.#prefix(message), ...args);
  }

  replace(_value: string): void {
    this.#blocked('replace');
  }

  show(preserveFocusOrColumn?: boolean | vscode.ViewColumn, preserveFocus?: boolean): void {
    this.#log.show(
      typeof preserveFocusOrColumn === 'boolean' ? preserveFocusOrColumn : preserveFocus,
    );
  }

  trace(message: string, ...args: any[]): void {
    this.#log.trace(this.#prefix(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.#log.warn(this.#prefix(message), ...args);
  }
}
