import * as vscode from 'vscode';
import { Context } from '../context';
import { ExecutionId } from '../core/execution/executionId';
import { MacroRepl } from './macroRepl';

const REPL_NEWLINE = '\r\n';
export const PROMPT_JS = '\x1b[93mjs\x1b[0m\x1b[90m » \x1b[0m';
export const PROMPT_TS = '\x1b[96mts\x1b[0m\x1b[90m » \x1b[0m';

export class MacroReplTerminal implements vscode.Pseudoterminal, vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly onDidCloseEmitter: vscode.EventEmitter<void>;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private repl?: MacroRepl;

  constructor(
    private readonly context: Context,
    private readonly executionId: ExecutionId,
  ) {
    this.disposables = [
      (this.onDidCloseEmitter = new vscode.EventEmitter()),
      (this.onDidWriteEmitter = new vscode.EventEmitter()),
      {
        dispose: () => {
          if (this.repl) {
            this.repl.dispose();
            this.repl = undefined;
          }
        },
      },
    ];
  }

  dispose() {
    this.close();
  }

  public close(): void {
    this.context.viewManagers.tree.releaseOwnedIds(this.executionId);
    this.context.viewManagers.web.releaseOwnedIds(this.executionId);
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }

  public handleInput(data: string): void {
    this.repl?.handleInput(data);
  }

  public get onDidClose(): vscode.Event<void> {
    return this.onDidCloseEmitter.event;
  }

  public get onDidWrite(): vscode.Event<string> {
    return this.onDidWriteEmitter.event;
  }

  public open(initialDimensions?: vscode.TerminalDimensions): void {
    if (this.repl) {
      return;
    }

    const repl = new MacroRepl(this.context, this.executionId);
    repl.onDidWrite((text: string) =>
      this.onDidWriteEmitter.fire(text.replace(/\r?\n/g, REPL_NEWLINE)),
    );
    repl.setupHistory({ shared: true, size: 1000 });
    repl.onDidClose(() => {
      this.onDidCloseEmitter.fire();
      this.close();
    });

    this.repl = repl;
    if (initialDimensions) {
      this.setDimensions(initialDimensions);
    }

    this.repl.displayText(
      '\x1b[1mMacros REPL\x1b[0m — JS/TS code evaluation with extension context and API access.\nType ".help" for more information.\n\n',
      { displayPrompt: true },
    );
  }

  public setDimensions({ columns, rows }: vscode.TerminalDimensions): void {
    this.repl?.setDimensions(columns, rows);
  }
}
