import * as vscode from 'vscode';
import { REPLCommand, REPLServer, start as startREPL } from 'repl';
import { PassThrough } from 'stream';
import { Context } from 'vm';
import { initalizeContext, initializeMacrosApi } from './macrosApi';

export class MacroTerminal implements vscode.Pseudoterminal {
  private readonly cts: vscode.CancellationTokenSource;
  private readonly disposables: vscode.Disposable[];
  private readonly input: PassThrough;
  private readonly name: string;
  private readonly onDidCloseEmitter: vscode.EventEmitter<void>;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly output: PassThrough & { columns?: number; rows?: number };
  private repl?: REPLServer;

  constructor(name: string) {
    this.cts = new vscode.CancellationTokenSource();
    this.input = new PassThrough();
    this.name = name;
    this.onDidCloseEmitter = new vscode.EventEmitter();
    this.onDidWriteEmitter = new vscode.EventEmitter();
    this.output = new PassThrough({ encoding: 'utf-8' })
      .on('data', (chunk: string) => {
        this.onDidWriteEmitter.fire(chunk.replaceAll('\n', '\r\n'));
        console.log('>>>', chunk);
      });

    this.disposables = [
      { dispose: () => this.input.destroy() },
      { dispose: () => this.output.destroy() },
      { dispose: () => this.repl?.close() },
      this.cts,
      this.onDidCloseEmitter,
      this.onDidWriteEmitter
    ];
  }

  public close(): void {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public handleInput(data: string): void {
    this.input.write(data);
  }

  public get onDidClose(): vscode.Event<void> {
    return this.onDidCloseEmitter.event;
  }

  public get onDidWrite(): vscode.Event<string> {
    return this.onDidWriteEmitter.event;
  }

  public open(): void {
    if (this.repl) {
      return;
    }

    const repl = startREPL({
      input: this.input,
      output: this.output,
      terminal: true,
      useColors: true,
    }).on('exit', () => {
      this.onDidCloseEmitter.fire();
      this.close();
    });

    const writableRepl = (repl.commands as NodeJS.Dict<REPLCommand>);
    delete writableRepl.break;
    delete writableRepl.load;
    delete writableRepl.save;

    repl.defineCommand('clear', {
      help: 'Reset context',
      action: (_text) => {
        this.setupContext(repl.context);
        repl.displayPrompt();
      }
    });

    this.setupContext(repl.context);
    this.repl = repl;
  }

  public setDimensions(dimensions: vscode.TerminalDimensions): void {
    this.output.columns = dimensions.columns;
    this.output.rows = dimensions.rows;
  }

  private setupContext(context: Context) {
    reset(context);
    initalizeContext(context);
    initializeMacrosApi(
      context,
      vscode.Uri.parse(`macro://terminal/${this.name}`),
      this.name,
      this.cts.token
    );

    function reset(context: Context) {
      Object.keys(context).forEach(k => delete context[k]);
    }
  }
}