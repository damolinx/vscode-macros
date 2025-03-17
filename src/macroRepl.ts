import * as vscode from 'vscode';
import { Macro } from './macro';
import { MacroOptions } from './macroOptions';
import { Runner } from './runner';

export class MacroRepl implements Macro, vscode.Pseudoterminal {
  static id = 100;

  private readonly history: string[];
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly runner: Runner;
  public readonly shortName: string;
  public readonly uri: vscode.Uri;

  constructor() {
    this.history = [];
    this.onDidWriteEmitter = new vscode.EventEmitter();
    this.runner = new Runner(this);
    this.shortName = `repl${MacroRepl.id}`;
    this.uri = vscode.Uri.from({ scheme: 'macro', authority: 'terminal', path: `/${this.shortName}` });
  }

  getCode(): string {
    return this.history[this.history.length - 1] ?? '';
  }

  getCodeAndOptions(): { code: string; options: MacroOptions; } {
    return {
      code: this.getCode(),
      options: {
        persistent: true
      }
    };
  }

  public get onDidWrite(): vscode.Event<string> {
    return this.onDidWriteEmitter.event;
  }

  open(_initialDimensions?: vscode.TerminalDimensions): void {
    this.onDidWriteEmitter.fire(this.getPrompt());
    this.history.push('');
  }

  close(): void {
    this.onDidWriteEmitter.dispose();
    this.runner.dispose();
  }

  handleInput(data: string): void {
    let currentStmt: string | undefined;
    switch (data) {
      case '\r': // Enter
        currentStmt = this.getCode().trim();
        if (!currentStmt) {
          if (this.history.length) {
            this.history[this.history.length - 1] = currentStmt;
          }
          this.onDidWriteEmitter.fire('\r\n' + this.getPrompt());
          return;
        }

        if (this.history.length > 1) {
          if (currentStmt === this.history[this.history.length - 2]) {
            this.history.pop();
          }
          const maxHistorySize = this.maxHistorySize;
          if (maxHistorySize && this.history.length > maxHistorySize) {
            this.history.shift();
          }
        }

        this.runner.run(false)
          .then((value) => {
            if (value !== undefined && value !== null) {
              this.onDidWriteEmitter.fire(`\r\n${value}`);
            }
          })
          .catch((reason) => this.onDidWriteEmitter.fire(`\r\n\x1b[31m${reason}\x1b[0m`))
          .finally(() => {
            this.history.push('');
            this.onDidWriteEmitter.fire('\r\n' + this.getPrompt());
          });
        break;
      case '\x7f': // Backspace
        currentStmt = this.getCode();
        if (currentStmt.length) {
          this.history[this.history.length - 1] = currentStmt.slice(0, -1);
          this.onDidWriteEmitter.fire('\b \b');
        }
        break;
      default:
        if (!data.startsWith('\x1b[')) { // Ignore navigation / else
          this.history[this.history.length - 1] += data;
          this.onDidWriteEmitter.fire(data);
        }
        break;
    }
  }

  private get maxHistorySize(): number {
    return vscode.workspace.getConfiguration().get('macros.terminal.history', 100);
  }

  public getPrompt(): string {
    return '\x1b[30m> \x1b[0m';
  }
}
