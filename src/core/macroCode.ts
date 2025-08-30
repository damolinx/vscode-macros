import * as vscode from 'vscode';
import * as ts from 'typescript';
import { Lazy } from '../utils/lazy';
import { getMacroId, MacroId } from './macroId';
import { MacroOptions, parseOptions } from './macroOptions';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly languageId: string;
  public readonly macroId: MacroId;
  public readonly rawCode: string;
  private runnableCode?: string;
  private transpileDiags?: ts.Diagnostic[];
  public readonly version: number;

  constructor(document: vscode.TextDocument, macroId = getMacroId(document.uri)) {
    this._options = new Lazy(() => parseOptions(this.rawCode));
    this.languageId = document.languageId;
    this.macroId = macroId;
    this.rawCode = document.getText();
    this.version = document.version;
  }

  /**
   * Gets runnable version of {@link rawCode}.
   * - For JavaScript, this is the code itself, end-trimmed.
   * - For TypeScript, this is the transpiled version. Transpilation result is
   *   cached, and a failed result will end on error every time.
   */
  public getRunnableCode(): string {
    if (this.transpileDiags?.length) {
      throw new Error(formatDiagnostics(this.transpileDiags));
    }

    if (!this.runnableCode) {
      if (this.languageId === 'typescript') {
        const [code, diags] = transpile(this.rawCode);
        if (diags) {
          this.transpileDiags = diags;
          throw new Error(formatDiagnostics(this.transpileDiags));
        }
        this.runnableCode = code;
      } else {
        this.runnableCode = this.rawCode.trimEnd();
      }
    }

    return this.runnableCode;

    function formatDiagnostics(diags: ts.Diagnostic[]): string {
      return ts.formatDiagnosticsWithColorAndContext(diags, {
        getCurrentDirectory: () => process.cwd(),
        getCanonicalFileName: (f) => f,
        getNewLine: () => '\n',
      });
    }

    function transpile(code: string): [string, undefined] | [undefined, ts.Diagnostic[]] {
      const diags: ts.Diagnostic[] = [];
      const transpiledCode = ts.transpile(code, {}, undefined, diags);
      return diags.length ? [undefined, diags] : [transpiledCode, undefined];
    }
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
