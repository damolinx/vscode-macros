import * as vscode from 'vscode';
import { REPLServer, start as startREPL } from 'repl';
import { PassThrough } from 'stream';
import { Context } from 'vm';
import { MacrosLogOutputChannel } from './api/macroLogOutputChannel';
import { createMacro } from './commands/createMacro';
import { initializeContext, MacroContextInitParams } from './core/execution/macroRunContext';
import { ExtensionContext } from './extensionContext';
import { showMacroQuickPick } from './ui/dialogs';

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

  constructor(context: ExtensionContext, name: string) {
    this.context = context;
    this.cts = new vscode.CancellationTokenSource();
    this.macroInitParams = {
      disposables: [],
      log: new MacrosLogOutputChannel(name, context),
      runId: name,
      token: this.cts.token,
    };
    this.onDidCloseEmitter = new vscode.EventEmitter();
    this.onDidWriteEmitter = new vscode.EventEmitter();
  }

  public close(): void {
    vscode.Disposable.from(...this.macroInitParams.disposables).dispose();
    this.cts.dispose();
    this.onDidCloseEmitter.dispose();
    this.onDidWriteEmitter.dispose();
    this.repl?.dispose();
  }

  public handleInput(data: string): void {
    this.repl?.input.write(data);
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

    this.onDidWriteEmitter.fire('Macro REPL — same APIs as in a macro file ara available\r\nType .help for available commands\r\n\r\n');

    const input = new PassThrough();
    const output = new PassThrough({ encoding: 'utf-8' }).on('data', (chunk: string) =>
      this.onDidWriteEmitter.fire(chunk.replaceAll('\n', '\r\n')),
    );
    const replServer = startREPL({
      input,
      output,
      prompt: '\x1b[90m≫ \x1b[0m',
      terminal: true,
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
          output.write('Nothing to load\n');
        }
        replServer.displayPrompt();
      },
    });

    // Override to save directly to an untitled editor
    replServer.defineCommand('save', {
      help: 'Save all evaluated commands into a new editor',
      action: async () => {
        const nonCommandStmts = replServer.history?.filter((s) => !s.trimStart().startsWith('.'));
        if (nonCommandStmts?.length) {
          await createMacro(this.context, undefined, {
            content: `\n// History: ${new Date().toLocaleString()}\n\n` + nonCommandStmts.reverse().join('\n'),
            preserveFocus: true,
          });
        } else {
          output.write('Nothing to save\n');
        }
        replServer.displayPrompt();
      },
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

  private setupContext(context: Context) {
    // REPL's context contains additional values that would not normally be
    // available to a macro and could cause confusion, so resetting first.
    Object.keys(context).forEach((k) => delete context[k]);
    initializeContext(context, this.macroInitParams);
  }
}
