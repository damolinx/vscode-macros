import * as vscode from 'vscode';
import { Lazy } from '../utils/lazy';
import { TranspilationError, transpileOrThrow } from '../utils/typescript';
import { getMacroId, MacroId } from './macroId';
import { MacroOptions, parseOptions } from './macroOptions';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly languageId: string;
  public readonly macroId: MacroId;
  public readonly rawCode: string;
  private runnableCode?: string;
  private transpilationError?: TranspilationError;
  private uri: vscode.Uri;
  public readonly version: number;

  constructor(document: vscode.TextDocument, macroId = getMacroId(document.uri)) {
    this._options = new Lazy(() => parseOptions(this.rawCode));
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
        } catch (err) {
          if (err instanceof TranspilationError) {
            this.transpilationError = err;
          }
          throw err;
        }
      } else {
        this.runnableCode = this.rawCode.trimEnd();
      }
    }

    return this.runnableCode;
  }

  /**
   * Verifies whether this instance is in sync with the given {@link document}.
   */
  public isCurrentFor(document: vscode.TextDocument): boolean {
    return this.macroId === getMacroId(document.uri) && this.isCurrentForKnown(document);
  }

  /**
   * Verifies whether this instance is in sync with the given {@link document},
   * but assumes {@link document} originates from the same URI.
   */
  public isCurrentForKnown(document: vscode.TextDocument): boolean {
    return this.languageId === document.languageId && this.version === document.version;
  }

  /**
   * Gets {@link MacroOptions} defined in the associated document.
   */
  public get options(): MacroOptions {
    return this._options.get();
  }
}
