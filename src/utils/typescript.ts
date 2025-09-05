import * as vscode from 'vscode';
import * as util from 'util';
import * as ts from 'typescript';
import { parent, uriBasename } from './uri';

export const RecoverableCodes: Readonly<Set<number>> = new Set([
  1005, // `'token' expected` — classic missing semicolon, brace, or parenthesis
  1003, // `Identifier expected` — often mid-declaration or incomplete statement
  1009, // `'(' expected` — likely incomplete function or call expression
  1010, // `')' expected` — unclosed argument list or grouping
  1109, // `Expression expected` — mid-expression, often recoverable
  1128, // `Declaration or statement expected` — inside unclosed block or directive
  1160, // `Unterminated string literal` — user is still typing a string
]);

export function transpile(
  code: string,
  fileNameOrUri?: string | vscode.Uri,
): [string, undefined] | [undefined, ts.Diagnostic[]] {
  const output = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2024,
      module: ts.ModuleKind.None,
    },
    fileName: fileNameOrUri && uriBasename(fileNameOrUri),
    reportDiagnostics: true,
  });

  return output.diagnostics?.length ? [undefined, output.diagnostics] : [fix(output), undefined];

  function fix({ outputText }: ts.TranspileOutput) {
    return outputText.replace(
      /Object\.defineProperty\(exports, "__esModule", { value: true }\);\s*/g,
      '',
    );
  }
}

export function transpileOrThrow(code: string, fileNameOrUri?: string | vscode.Uri): string {
  const [transpiledCode, diagnostics] = transpile(code, fileNameOrUri);
  if (diagnostics) {
    const error = new TranspilationError('Code transpilation failed.', diagnostics, fileNameOrUri);
    error.stack = '';
    throw error;
  }

  return transpiledCode;
}

export function formatDiagnostics(diagnostics: ts.Diagnostic[], uri?: vscode.Uri): string {
  return ts.formatDiagnostics(diagnostics, {
    getCurrentDirectory: () => (uri ? parent(uri).toString() : ts.sys.getCurrentDirectory()),
    getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? (f) => f : (f) => f.toLowerCase(),
    getNewLine: () => '\n',
  });
}

export class TranspilationError extends Error {
  public readonly diagnostics: ts.Diagnostic[];
  public readonly fileNameOrUri?: string | vscode.Uri;

  constructor(message: string, diagnostics: ts.Diagnostic[], fileNameOrUri?: string | vscode.Uri) {
    super(message);
    this.name = 'TranspilationError';
    this.diagnostics = diagnostics;
    this.fileNameOrUri = fileNameOrUri;
  }

  [util.inspect.custom](_depth: number, options: util.InspectOptionsStylized) {
    const host: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (fileName) => uriBasename(this.fileNameOrUri || fileName),
      getNewLine: () => ts.sys.newLine,
    };
    return options.colors
      ? ts.formatDiagnosticsWithColorAndContext(this.diagnostics, host)
      : ts.formatDiagnostics(this.diagnostics, host);
  }

  public isRecoverable(): boolean {
    return this.diagnostics.some((d) => RecoverableCodes.has(d.code));
  }
}
