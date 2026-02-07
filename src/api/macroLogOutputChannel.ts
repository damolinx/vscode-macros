import * as vscode from 'vscode';
import { inspect } from 'util';
import { SandboxExecutionId } from '../core/execution/sandboxExecutionId';
import { ExtensionContext } from '../extensionContext';
import { cleanStack } from '../utils/errors';

/**
 * Log channel for macros. Wraps the extension's main logger to prepend
 * the macro run ID and prevent execution of unsafe operations.
 */
export class MacroLogOutputChannel implements vscode.LogOutputChannel {
  readonly #executionId: string;
  readonly #log: vscode.LogOutputChannel;
  readonly #prefix: string;

  constructor(executionId: SandboxExecutionId, { log }: ExtensionContext) {
    this.#executionId = executionId;
    this.#log = log;
    this.#prefix = `[${executionId}]`;
  }

  dispose(): void {
    this.#blocked('dispose');
  }

  [inspect.custom]() {
    return {
      name: this.name,
      logLevel: vscode.LogLevel[this.logLevel],
      runId: this.#executionId,
    };
  }

  #blocked(methodName: string): void {
    this.warn(`Macros cannot call \`${methodName}\`; ignoring.`);
  }

  #withPrefix(message: string): string {
    return message ? `${this.#prefix} ${message}` : this.#prefix;
  }

  append(value: string): void {
    if (value) {
      this.#log.append(this.#withPrefix(value));
    }
  }

  appendLine(value: string): void {
    this.#log.appendLine(this.#withPrefix(value));
  }

  clear(): void {
    this.#blocked('clear');
  }

  debug(message: string, ...args: any[]): void {
    this.#log.debug(this.#withPrefix(message), ...args);
  }

  error(error: string | Error, ...args: any[]): void {
    if (typeof error === 'string') {
      return this.#log.error(this.#withPrefix(error), ...args);
    }

    const withIdError = new Error(this.#withPrefix(String(error)), { cause: error });
    withIdError.stack = error.stack && cleanStack(error.stack);
    this.#log.error(withIdError, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.#log.info(this.#withPrefix(message), ...args);
  }

  hide(): void {
    this.#log.hide();
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

  replace(_value: string): void {
    this.#blocked('replace');
  }

  show(preserveFocusOrColumn?: boolean | vscode.ViewColumn, preserveFocus?: boolean): void {
    this.#log.show(
      typeof preserveFocusOrColumn === 'boolean' ? preserveFocusOrColumn : preserveFocus,
    );
  }

  trace(message: string, ...args: any[]): void {
    this.#log.trace(this.#withPrefix(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.#log.warn(this.#withPrefix(message), ...args);
  }
}
