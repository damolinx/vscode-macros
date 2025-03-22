import * as vscode from 'vscode';
import { REPLServer, start as startREPL } from 'repl';
import { PassThrough } from 'stream';
import { Context } from 'vm';
import { createMacro } from './commands/createMacro';
import { selectMacroFile } from './common/selectMacroFile';
import { initalizeContext, initializeMacrosApi } from './macrosApi';

export class MacroTerminal implements vscode.Pseudoterminal {
  private readonly context: vscode.ExtensionContext;
  private readonly cts: vscode.CancellationTokenSource;
  private readonly disposables: vscode.Disposable[];
  private readonly input: PassThrough;
  private readonly name: string;
  private readonly onDidCloseEmitter: vscode.EventEmitter<void>;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly output: PassThrough & { columns?: number; rows?: number };
  private repl?: REPLServer;

  constructor(context: vscode.ExtensionContext, name: string) {
    this.context = context;
    this.cts = new vscode.CancellationTokenSource();
    this.input = new PassThrough();
    this.name = name;
    this.onDidCloseEmitter = new vscode.EventEmitter();
    this.onDidWriteEmitter = new vscode.EventEmitter();
    this.output = new PassThrough({ encoding: 'utf-8' })
      .on('data', (chunk: string) => {
        this.onDidWriteEmitter.fire(chunk.replaceAll('\n', '\r\n'));
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
      prompt: '\x1b[90m≫ \x1b[0m', // Changed to dark gray formatting
      terminal: true,
      useColors: true,
    }).on('exit', () => {
      this.onDidCloseEmitter.fire();
      this.close();
    }) as REPLServer & { history: string[] };

    // Override to provide sane help 
    const originalBreak = repl.commands.break;
    repl.defineCommand('break', {
      help: 'Break from multi-line editing mode',
      action: (text) => originalBreak?.action.call(repl, text)
    });

    // Override to setup context
    const originalClear = repl.commands.clear;
    repl.defineCommand('clear', {
      help: 'Reset context',
      action: (text) => {
        originalClear?.action.call(repl, text);
        this.setupContext(repl.context);
      }
    });

    // Override to connect to `selectMacroFile`
    const originalLoad = repl.commands.load;
    repl.defineCommand('load', {
      help: 'Load and evaluate a macro file',
      action: async () => {
        const file = await selectMacroFile({ hideOpenPerItem: true });
        if (file) {
          originalLoad?.action.call(repl, file.fsPath);
        } else {
          this.output.write('Nothing to load\n');
        }
        repl.displayPrompt();
      }
    });

    // Override to save directly to an untitled editor 
    repl.defineCommand('save', {
      help: 'Save all evaluated commands into a new editor',
      action: async () => {
        const content = repl.history.filter(s => !s?.startsWith('.')).reverse().join('\n');
        if (content) {
          await createMacro(this.context, content, { preserveFocus: true });
        } else {
          this.output.write('Nothing to save\n');
        }
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