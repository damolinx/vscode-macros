import * as vscode from 'vscode';
import { TranspilationError, transpileOrThrow } from '../../typescript/transpilation';
import { getMacroId } from './codeMacroId';
import { CodeMacroOptions, parseCodeMacroOptions } from './codeMacroOptions';

export class CodeSnapshot {
  private _options?: CodeMacroOptions;
  public readonly languageId: string;
  public readonly rawCode: string;
  private runnableCode?: string;
  private transpilationError?: TranspilationError;
  private readonly uri: vscode.Uri;
  public readonly version: number;

  constructor(
    document: vscode.TextDocument,
    public readonly macroId = getMacroId(document.uri),
  ) {
    this.languageId = document.languageId;
    this.rawCode = document.getText();
    this.uri = document.uri;
    this.version = document.version;
  }

  /**
   * Gets runnable version of {@link rawCode}.
   * - For JavaScript, this is the code itself, end-trimmed.
   * - For TypeScript, this is the transpiled version. Transpilation result is
   *   cached, and a failed result will end on error every time.
   */
  public getRunnableCode(): string {
    if (this.transpilationError) {
      throw this.transpilationError;
    }

    if (!this.runnableCode) {
      if (this.languageId === 'typescript') {
        try {
          this.runnableCode = transpileOrThrow(this.rawCode, this.uri);
        } catch (error) {
          if (error instanceof TranspilationError) {
            this.transpilationError = error;
          }
          throw error;
        }
      } else {
        this.runnableCode = this.rawCode.trimEnd();
      }
    }

    return this.runnableCode;
  }

  /**
   * Macro {@link CodeMacroOptions options} parsed from the source code.
   */
  public get options(): CodeMacroOptions {
    this._options ??= parseCodeMacroOptions(this.rawCode);
    return this._options;
  }
}
