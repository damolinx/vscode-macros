import * as vscode from 'vscode';
import { Recoverable, REPLServer, start as startREPL } from 'repl';
import { PassThrough } from 'stream';
import { inspect, types } from 'util';
import * as vm from 'vm';
import { MacroLogOutputChannel } from './api/macroLogOutputChannel';
import { createMacro } from './commands/createMacro';
import { initializeContext, MacroContextInitParams } from './core/execution/macroRunContext';
import { getSandboxExecutionId } from './core/execution/sandboxExecutionId';
import { transpileOrThrow, TranspilationError } from './core/typescript/transpilation';
import { ExtensionContext } from './extensionContext';
import { showMacroQuickPick } from './ui/dialogs';
import { cleanError } from './utils/errors';

const REPL_NEWLINE = '\r\n';
export const PROMPT_JS = '\x1b[93mjs\x1b[0m\x1b[90m » \x1b[0m';
export const PROMPT_TS = '\x1b[96mts\x1b[0m\x1b[90m » \x1b[0m';

type REPLServerWithHistory = REPLServer & { history?: string[] };

export class MacroPseudoterminal implements vscode.Pseudoterminal {
  private readonly context: ExtensionContext;
  private readonly cts: vscode.CancellationTokenSource;
  private readonly macroInitParams: MacroContextInitParams;
  private readonly onDidCloseEmitter: vscode.EventEmitter<void>;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private repl?: {
    input: PassThrough;
    output: PassThrough & { columns?: number; rows?: number };
    server: REPLServerWithHistory;
  } & vscode.Disposable;
  private readonly uri: vscode.Uri;
  private useTs: boolean;

  constructor(context: ExtensionContext, name: string, index: number) {
    const runId = getSandboxExecutionId(name, index);

    this.context = context;
    this.cts = new vscode.CancellationTokenSource();
    this.onDidCloseEmitter = new vscode.EventEmitter();
    this.onDidWriteEmitter = new vscode.EventEmitter();
    this.uri = vscode.Uri.from({ scheme: '', path: runId });
    this.useTs = false;

    this.macroInitParams = {
      disposables: [],
      log: new MacroLogOutputChannel(runId, context),
      executionId: runId,
      token: this.cts.token,
      viewManagers: {
        tree: this.context.treeViewManager,
        web: this.context.webviewManager,
      },
    };
  }

  public close(): void {
    this.context.treeViewManager.releaseOwnedIds(this.macroInitParams.executionId);
    this.context.webviewManager.releaseOwnedIds(this.macroInitParams.executionId);
    vscode.Disposable.from(...this.macroInitParams.disposables).dispose();
    this.cts.dispose();
    this.onDidCloseEmitter.dispose();
    this.onDidWriteEmitter.dispose();
    this.repl?.dispose();
  }

  async evaluate(
    code: string,
    context: vm.Context,
    callback: (error: Error | null, result: any) => void,
  ) {
    try {
      const targetCode = this.useTs ? transpileOrThrow(code, this.uri) : code;
      const result = await vm.runInContext(targetCode, context);
      callback(null, result);
    } catch (e: any) {
      const targetError = isRecoverable(e) ? new Recoverable(e) : e;
      callback(targetError, null);
    }

    function isRecoverable(e: Error) {
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

  public handleInput(data: string): void {
    this.repl?.input.write(data);
  }

  private inspectObj(obj: any): string {
    const result = types.isNativeError(obj)
      ? inspect(cleanError(obj, true), { colors: this.repl?.server.useColors })
      : inspect(obj, { colors: this.repl?.server.useColors, compact: false, depth: 2 });
    return result;
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

    this.onDidWriteEmitter.fire(
      `\x1b[1mMacros REPL\x1b[0m — JS/TS code evaluation with extension context and API access.${REPL_NEWLINE}Type ".help" for more information.${REPL_NEWLINE}${REPL_NEWLINE}`,
    );

    const input = new PassThrough();
    const output = new PassThrough({ encoding: 'utf-8' }).on('data', (chunk: string) =>
      this.onDidWriteEmitter.fire(chunk.replaceAll('\n', REPL_NEWLINE)),
    );
    const replServer = startREPL({
      eval: (code, ctx, _, cb) => this.evaluate(code, ctx, cb),
      input,
      output,
      preview: true,
      prompt: PROMPT_JS,
      terminal: true,
      writer: (obj: any) => this.inspectObj(obj),
      useColors: true,
    }).on('exit', () => {
      this.onDidCloseEmitter.fire();
      this.close();
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
        });
        if (file) {
          originalLoad?.action.call(replServer, file.fsPath);
        } else {
          output.write(`Nothing to load${REPL_NEWLINE}`);
        }
        replServer.displayPrompt();
      },
    });

    // Override to save directly to an untitled editor
    replServer.defineCommand('save', {
      help: 'Save all evaluated commands into a new editor',
      action: async () => {
        const history = replServer.history?.reduce((acc, val, _i) => {
          const value = val.trim();
          if (!value.startsWith('.')) {
            acc.unshift(value);
          }
          return acc;
        }, [] as string[]);

        if (history?.length) {
          const document = await createMacro(this.context, undefined, {
            content: `\n// History: ${new Date().toLocaleString()}\n\n` + history.join('\n'),
            language: this.useTs ? 'typescript' : 'javascript',
            preserveFocus: true,
          });
          if (document) {
            output.write(`Saved history to ${document?.uri.path} ${REPL_NEWLINE}`);
          }
        } else {
          output.write(`Nothing to save${REPL_NEWLINE}`);
        }
        replServer.displayPrompt();
      },
    });

    // Language
    replServer.defineCommand('js', {
      help: 'Evaluate input as JavaScript code.',
      action: () => this.setEvaluationMode('js'),
    });
    replServer.defineCommand('ts', {
      help: 'Evaluate input as TypeScript code.',
      action: () => this.setEvaluationMode('ts'),
    });

    this.setupContext(replServer.context);
    this.repl = {
      dispose: () => {
        replServer.close();
        input.destroy();
        output.destroy();
      },
      input,
      output,
      server: replServer,
    };
  }

  public setDimensions(dimensions: vscode.TerminalDimensions): void {
    if (this.repl) {
      this.repl.output.columns = dimensions.columns;
      this.repl.output.rows = dimensions.rows;
    }
  }

  public setEvaluationMode(mode: 'js' | 'ts') {
    let name: string, prompt: string;
    switch (mode) {
      case 'ts':
        name = '\x1b[96mTypeScript\x1b[0m\x1b[90m';
        this.useTs = true;
        prompt = PROMPT_TS;
        break;
      default:
        name = '\x1b[93mJavaScript\x1b[0m\x1b[90m';
        this.useTs = false;
        prompt = PROMPT_JS;
        break;
    }

    this.onDidWriteEmitter.fire(`Evaluation Mode: ${name}${REPL_NEWLINE}`);
    this.repl?.server.setPrompt(prompt);
    this.repl?.server.displayPrompt();
  }

  private setupContext(context: vm.Context) {
    // REPL's context contains additional values that would not normally be
    // available to a macro and could cause confusion, so resetting first.
    Object.keys(context).forEach((k) => delete context[k]);
    initializeContext(context, this.macroInitParams);
  }
}
