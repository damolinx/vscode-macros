import * as vscode from 'vscode';
import os from 'os';
import path from 'path';
import { Recoverable, REPLServer, start as startREPL } from 'repl';
import { PassThrough } from 'stream';
import { inspect } from 'util';
import * as vm from 'vm';
import { createMacro } from '../commands/createMacro';
import { Context } from '../context';
import { initializeContext, MacroContextParams } from '../core/execution/macroContext';
import { transpileOrThrow, TranspilationError } from '../core/typescript/transpilation';
import { showMacroQuickPick } from '../ui/dialogs';
import { cleanError } from '../utils/errors';

type REPLServerWithHistory = REPLServer & { history?: string[] };

let sharedHistory: string[] | undefined;

export class MacroRepl implements vscode.Disposable {
  private readonly cts: vscode.CancellationTokenSource;
  private readonly disposables: vscode.Disposable[];
  private readonly executionHistory: string[];
  private readonly onDidCloseEmitter: vscode.EventEmitter<void>;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly input: PassThrough;
  private readonly output: PassThrough & { columns?: number; rows?: number };
  private readonly replServer: REPLServerWithHistory;

  constructor(
    private readonly context: Context,
    public readonly id: string,
    public useTs = false,
  ) {
    this.cts = new vscode.CancellationTokenSource();
    this.executionHistory = [];
    this.onDidCloseEmitter = new vscode.EventEmitter();
    this.onDidWriteEmitter = new vscode.EventEmitter();

    this.input = new PassThrough();
    this.output = new PassThrough({ encoding: 'utf-8' });
    this.output.on('data', (chunk: string) => this.onDidWriteEmitter.fire(chunk));

    this.replServer = this.createReplServer(this.input, this.output);
    this.replServer.on('exit', () => this.onDidCloseEmitter.fire());
    this.setEvalMode('js', false);

    this.disposables = [
      this.cts,
      this.onDidCloseEmitter,
      this.onDidWriteEmitter,
      { dispose: () => this.input.destroy() },
      { dispose: () => this.output.destroy() },
      { dispose: () => this.replServer.close() },
    ];
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }

  private createReplServer(input: PassThrough, output: PassThrough): REPLServerWithHistory {
    const replServer = startREPL({
      eval: (code, ctx, _, cb) => this.evaluate(code, ctx, cb),
      input,
      output,
      preview: true,
      terminal: true,
      useColors: true,
      writer: (obj: any) => this.inspectObj(obj),
    }) as REPLServerWithHistory;

    // Override to provide sane help
    const originalBreak = replServer.commands.break;
    replServer.defineCommand('break', {
      help: 'Break from multi-line editing mode',
      action: (text) => originalBreak?.action.call(replServer, text),
    });

    // Override to setup context
    const originalClear = replServer.commands.clear;
    replServer.defineCommand('clear', {
      help: 'Reset macro context',
      action: (text) => {
        originalClear?.action.call(replServer, text);
        this.setupContext(replServer.context);
      },
    });

    // Override to connect to `selectMacroFile`
    const originalLoad = replServer.commands.load;
    replServer.defineCommand('load', {
      help: 'Load and evaluate a macro file',
      action: async () => {
        const file = await showMacroQuickPick(this.context.libraryManager, {
          hideOpenPerItem: true,
          placeHolder: 'Select a macro to load',
        });
        if (file) {
          originalLoad?.action.call(replServer, file.fsPath);
        } else {
          this.output.write('Nothing to load\n');
        }
        replServer.displayPrompt();
      },
    });

    // Override to save directly to an untitled editor
    replServer.defineCommand('save', {
      help: 'Save session history to a new editor',
      action: async () => {
        const history = this.executionHistory
          .map((value) => value.trim())
          .filter((value) => !/^\.[a-z]/i.test(value));

        if (history.length) {
          const document = await createMacro(this.context, undefined, {
            content: `\n// History: ${new Date().toLocaleString()}\n\n` + history.join('\n'),
            languageId: this.useTs ? 'typescript' : 'javascript',
            preserveFocus: true,
          });
          if (document) {
            this.output.write(`Saved session history to ${document.uri.path}\n`);
          }
        } else {
          this.output.write('Nothing to save\n');
        }
        replServer.displayPrompt();
      },
    });

    // Language
    replServer.defineCommand('js', {
      help: 'Evaluate input as JavaScript code.',
      action: () => this.setEvalMode('js'),
    });
    replServer.defineCommand('ts', {
      help: 'Evaluate input as TypeScript code.',
      action: () => this.setEvalMode('ts'),
    });

    this.setupContext(replServer.context);
    return replServer;
  }

  public displayText(text: string, options: { displayPrompt: boolean }): void {
    this.onDidWriteEmitter.fire(text);
    if (options.displayPrompt) {
      this.replServer.displayPrompt();
    }
  }

  private async evaluate(
    code: string,
    context: vm.Context,
    callback: (error: Error | null, result: any) => void,
  ): Promise<void> {
    // Heuristic - matching "try { ... } catch {}" could work.
    const maybePreview = !code.endsWith('\n');
    try {
      const targetCode = this.useTs
        ? transpileOrThrow(code, vscode.Uri.from({ scheme: '', path: this.id }))
        : code;
      const result = await vm.runInContext(targetCode, context);
      callback(null, result);
      if (!maybePreview) {
        this.executionHistory.push(code.trim());
      }
    } catch (e: any) {
      let targetError = e;
      if (isRecoverable(e)) {
        targetError = new Recoverable(e);
      } else if (!maybePreview) {
        this.executionHistory.push(
          `${code.trim()} // Failed${e.message ? `: ${e.message}` : ''}`,
        );
      }
      callback(targetError, null);
    }

    function isRecoverable(e: Error): boolean {
      let recoverable = false;
      if (e.name === 'SyntaxError') {
        // TODO: edge case "e.push({}{})"
        recoverable = /Unexpected end of input|missing.+after argument list/.test(e.message);
      } else if (e.name === 'TranspilationError' && (e as TranspilationError).isRecoverable()) {
        recoverable = true;
      }
      return recoverable;
    }
  }

  public handleInput(text: string): void {
    this.input.write(text);
  }

  private inspectObj(obj: any): string {
    const result = Error.isError(obj)
      ? inspect(cleanError(obj, true), { colors: this.replServer.useColors })
      : inspect(obj, { colors: this.replServer.useColors, compact: false, depth: 2 });
    return result;
  }

  public get onDidClose(): vscode.Event<void> {
    return this.onDidCloseEmitter.event;
  }

  public get onDidWrite(): vscode.Event<string> {
    return this.onDidWriteEmitter.event;
  }

  public setDimensions(columns?: number, rows?: number): void {
    if (columns !== undefined) {
      this.output.columns = columns;
    }
    if (rows !== undefined) {
      this.output.rows = rows;
    }
  }

  private setEvalMode(mode: 'js' | 'ts', announce = true) {
    let name: string, prompt: string;
    switch (mode) {
      case 'ts':
        name = '\x1b[96mTypeScript\x1b[0m\x1b[90m';
        this.useTs = true;
        prompt = '\x1b[96mts\x1b[0m\x1b[90m » \x1b[0m';
        break;
      default:
        name = '\x1b[93mJavaScript\x1b[0m\x1b[90m';
        this.useTs = false;
        prompt = '\x1b[93mjs\x1b[0m\x1b[90m » \x1b[0m';
        break;
    }

    if (announce) {
      this.onDidWriteEmitter.fire(`Evaluation Mode: ${name}\n`);
    }
    this.replServer.setPrompt(prompt);
    this.replServer.displayPrompt();
  }

  private setupContext(context: vm.Context): void {
    // REPL's context contains additional values that would not normally be
    // available to a macro and could cause confusion, so resetting first.
    Object.keys(context).forEach((k) => delete context[k]);

    const contextInitParams = {
      context: this.context,
      disposables: this.disposables,
      executionId: this.id,
      token: this.cts.token,
    } as MacroContextParams;
    initializeContext(context, contextInitParams);
  }

  public setupHistory({ shared, size }: { shared: boolean; size: number }): void {
    const filePath = shared
      ? vscode.Uri.joinPath(this.context.extensionContext.globalStorageUri, 'repl-history').fsPath
      : path.join(os.tmpdir(), `macro-repl-${this.id}.history`);

    this.replServer.setupHistory({
      filePath,
      size,
      removeHistoryDuplicates: true,
      onHistoryFileLoaded: (err) => {
        if (err) {
          this.context.log.error(`[${this.id}] Failed to setup REPL history:`, err);
          return;
        }

        if (shared) {
          sharedHistory ??= this.replServer.history ?? [];
          this.replServer.history = sharedHistory;
        }
      },
    });
  }
}
