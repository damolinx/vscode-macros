import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';

/**
 * Log output channel for macros. Wraps the extnesion's main logger to prepend
 * the macro run ID and help prevent execution of unsafe operations.
 */
export class MacrosLogOutputChannel implements vscode.LogOutputChannel {
  private readonly id: string;
  private readonly log: vscode.LogOutputChannel;

  constructor(runId: string, { log }: ExtensionContext) {
    this.id = `[${runId}]`;
    this.log = log;
  }

  dispose(): void {
    this.warn('Macro should not call `dispose` on the logger; ignoring call.');
  }

  get logLevel(): vscode.LogLevel {
    return this.log.logLevel;
  }

  get onDidChangeLogLevel(): vscode.Event<vscode.LogLevel> {
    return this.log.onDidChangeLogLevel;
  }

  get name(): string {
    return this.log.name;
  }

  debug(message: string, ...args: any[]): void {
    this.log.debug(this.id, message, ...args);
  }

  error(error: string | Error, ...args: any[]): void {
    this.log.error(this.id, error, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log.info(this.id, message, ...args);
  }

  trace(message: string, ...args: any[]): void {
    this.log.trace(this.id, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log.warn(this.id, message, ...args);
  }

  append(value: string): void {
    this.log.append(value);
  }

  appendLine(value: string): void {
    this.log.appendLine(value);
  }

  replace(_value: string): void {
    this.warn('Macro is not allowed to call `replace`; ignoring call.');
  }

  clear(): void {
    this.warn('Macro is not allowed to call `clear`; ignoring call.');
  }

  show(preserveFocusOrColumn?: boolean | vscode.ViewColumn, preserveFocus?: boolean): void {
    if (typeof preserveFocusOrColumn === 'boolean') {
      this.log.show(preserveFocusOrColumn);
    } else {
      this.log.show(preserveFocusOrColumn, preserveFocus);
    }
  }

  hide(): void {
    this.log.hide();
  }
}
