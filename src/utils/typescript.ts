import * as vscode from 'vscode';
import * as ts from 'typescript';
import { parent, uriBasename } from './uri';

export function transpile(
  code: string,
  uri?: vscode.Uri,
): [string, undefined] | [undefined, ts.Diagnostic[]] {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2024,
      module: ts.ModuleKind.None,
    },
    fileName: uri && uriBasename(uri),
    reportDiagnostics: true,
  });

  return result.diagnostics?.length
    ? [undefined, result.diagnostics]
    : [fixCode(result), undefined];

  function fixCode({ outputText }: ts.TranspileOutput) {
    return outputText.replace(
      /Object\.defineProperty\(exports, "__esModule", { value: true }\);\s*/g,
      '',
    );
  }
}

export function transpileOrThrow(code: string, uri?: vscode.Uri): string {
  const [transpiledCode, diagnostics] = transpile(code, uri);
  if (diagnostics) {
    const error = new TranspilationError(
      'Transpilation failed, check diagnostics.',
      diagnostics,
      uri,
    );
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
  public readonly uri?: vscode.Uri;

  constructor(message: string, diagnostics: ts.Diagnostic[], uri?: vscode.Uri) {
    super(message);
    this.name = 'TranspilationError';
    this.diagnostics = diagnostics;
    this.uri = uri;
  }
}
