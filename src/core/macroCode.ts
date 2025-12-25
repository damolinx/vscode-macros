import * as vscode from 'vscode';
import { getMacroId, MacroId } from './macroId';
import { MacroOptions, parseOptions } from './macroOptions';
import { TranspilationError, transpileOrThrow } from './typescript/transpilation';

export class MacroCode {
  private _options?: MacroOptions;
  public readonly languageId: string;
  public readonly macroId: MacroId;
  public readonly rawCode: string;
  private runnableCode?: string;
  private transpilationError?: TranspilationError;
  private readonly uri: vscode.Uri;
  public readonly version: number;

  constructor(document: vscode.TextDocument, macroId = getMacroId(document.uri)) {
    this.languageId = document.languageId;
    this.macroId = macroId;
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
   * Gets {@link MacroOptions options} defined in the macro document.
   */
  public get options(): MacroOptions {
    this._options ??= parseOptions(this.rawCode);
    return this._options;
  }
}
