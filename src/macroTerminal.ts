import * as vscode from 'vscode';
import { inspect } from 'util';
import { Runner } from './runner';

const ARROW_DOWN = '\x1b[B';
const ARROW_LEFT = '\x1b[D';
const ARROW_RIGHT = '\x1b[C';
const ARROW_UP = '\x1b[A';
const BACKSPACE = '\x7f';
const CARRIAGE_RETURN = '\x0d';
const CLEAR_LINE = '\x1b[2K\x1b[G';
const ESCAPE = '\x1b';
// const MOVE_END_OF_CURRENT_LINE = '\x1b[0K';
// const MOVE_PREVIOUS_LINE = '\x1b[F';
const NEWLINE = CARRIAGE_RETURN + '\x0a';
const PROMPT = '\x1b[1m\x1b[30m> \x1b[0m';

let id = 1;

export class MacroTerminal implements vscode.Pseudoterminal {

  private columns?: number;
  private readonly history: string[];
  private historyIndex?: number;
  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly runner: Runner;

  constructor() {
    this.history = [''];
    this.onDidWriteEmitter = new vscode.EventEmitter();
    this.runner = new Runner({
      getCode: () => {
        const code = this.history.at(-1) ?? '';
        return {
          code: code.startsWith('{') ? `(${code})` : code,
          options: { persistent: true }
        };
      },
      shortName: `macro${id}`,
      uri: vscode.Uri.parse(`macro://terminal/macro${id++}`),
    });
  }

  public close(): void {
    this.onDidWriteEmitter.dispose();
    this.runner.dispose();
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private convertToString(value: any): string {
    return inspect(value, {
      breakLength: this.columns,
      colors: true,
    });
  }

  private fireOnDidWrite(...args: string[]) {
    args.forEach(arg => this.onDidWriteEmitter.fire(arg.replaceAll('\n', NEWLINE)));
  }

  public handleInput(data: string): void {
    let statement;
    switch (data) {
      case ARROW_DOWN:
        if (this.history.length > 1) {
          if (this.historyIndex !== undefined) {
            if (this.historyIndex < (this.history.length - 2)) {
              this.historyIndex++;
              statement = this.history[this.historyIndex];
            } else {
              this.historyIndex = undefined;
              statement = '';
            }
            this.history[this.history.length - 1] = statement;
            this.fireOnDidWrite(CLEAR_LINE, PROMPT, statement);
          }
        }
        break;

      case ARROW_LEFT:
      case ARROW_RIGHT:
        // TODO: Support editing
        break;

      case ARROW_UP:
        if (this.history.length > 1) {
          if (this.historyIndex === undefined) {
            this.historyIndex = this.history.length - 2;
          } else if (this.historyIndex > 0) {
            this.historyIndex--;
          }

          statement = this.history[this.historyIndex];
          this.history[this.history.length - 1] = statement;
          this.fireOnDidWrite(CLEAR_LINE, PROMPT, statement);
        }
        break;

      case BACKSPACE:
        statement = this.history.at(-1);
        if (statement) {
          this.history[this.history.length - 1] = statement.slice(0, -1);
          this.fireOnDidWrite('\x1b[D\x1b[P');
        }
        break;

      case CARRIAGE_RETURN:
        this.historyIndex = undefined;
        statement = this.history.at(-1)?.trim() ?? '';
        this.history[this.history.length - 1] = statement;

        if (this.history.length > 1) {
          const duplicateIndex = this.history.lastIndexOf(statement, this.history.length - 2);
          if (duplicateIndex !== -1) {
            this.history.splice(duplicateIndex, 1);
          }
          if (this.history.length > this.maxHistorySize) {
            this.history.shift();
          }
        }

        if (!statement) {
          this.history[this.history.length - 1] = '';
          this.fireOnDidWrite(NEWLINE, PROMPT);
          return;
        }
        this.runner.run(false)
          .then((value) => {
            this.fireOnDidWrite(NEWLINE, this.convertToString(value));
          })
          .catch((reason) => {
            this.fireOnDidWrite(NEWLINE, `\x1b[31m${reason}\x1b[0m`); // Red
          })
          .finally(() => {
            this.history.push('');
            this.fireOnDidWrite(NEWLINE, PROMPT);
          });
        break;

      case ESCAPE:
        statement = this.history.at(-1);
        if (statement) {
          this.history[this.history.length - 1] = '';
          this.fireOnDidWrite(CLEAR_LINE, PROMPT);
        }
        break;

      default:
        if (!data.startsWith('\x1b[')) { // Ignore navigation / else
          this.history[this.history.length - 1] += data;
          this.fireOnDidWrite(data);
        }
        break;
    }
  }

  private get maxHistorySize(): number {
    return vscode.workspace.getConfiguration().get('macros.terminal.history', 100);
  }

  public get onDidWrite(): vscode.Event<string> {
    return this.onDidWriteEmitter.event;
  }

  public open(): void {
    this.onDidWriteEmitter.fire(PROMPT);
  }

  public setDimensions(dimensions: vscode.TerminalDimensions): void {
    this.columns = dimensions.columns;
  }
}
