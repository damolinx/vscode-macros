import * as vscode from 'vscode';
import * as ts from 'typescript';
import { Lazy } from '../utils/lazy';
import { uriBasename, parent } from '../utils/uri';
import { getMacroId, MacroId } from './macroId';
import { MacroOptions, parseOptions } from './macroOptions';

export class MacroCode {
  private readonly _options: Lazy<MacroOptions>;
  public readonly languageId: string;
  public readonly macroId: MacroId;
  public readonly rawCode: string;
  private runnableCode?: string;
  private transpileDiags?: ts.Diagnostic[];
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
    if (this.transpileDiags?.length) {
      throw new Error(formatDiagnostics(this.transpileDiags, this.uri));
    }

    if (!this.runnableCode) {
      if (this.languageId === 'typescript') {
        const [code, diags] = transpile(this.rawCode, this.macroId);
        if (diags) {
          this.transpileDiags = diags;
          throw new Error(formatDiagnostics(this.transpileDiags, this.uri));
        }
        this.runnableCode = code;
      } else {
        this.runnableCode = this.rawCode.trimEnd();
      }
    }

    return this.runnableCode;

    function formatDiagnostics(diags: ts.Diagnostic[], uri: vscode.Uri): string {
      return ts.formatDiagnostics(diags, {
        getCurrentDirectory: () => parent(uri).toString(),
        getCanonicalFileName: (f) => f,
        getNewLine: () => '\n',
      });
    }

    function transpile(
      code: string,
      macroId: MacroId,
    ): [string, undefined] | [undefined, ts.Diagnostic[]] {
      const result = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2024,
          module: ts.ModuleKind.None,
        },
        fileName: uriBasename(macroId),
        reportDiagnostics: true,
      });

      return result.diagnostics?.length
        ? [undefined, result.diagnostics]
        : [result.outputText, undefined];
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
