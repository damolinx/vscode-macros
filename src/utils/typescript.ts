import * as vscode from 'vscode';
import * as util from 'util';
import * as ts from 'typescript';
import { parent, uriBasename } from './uri';

export function transpile(
  code: string,
  uri?: vscode.Uri,
): [string, undefined] | [undefined, ts.Diagnostic[]] {
  const output = ts.transpileModule(code, {
    compilerOptions: {
      inlineSourceMap: true,
      module: ts.ModuleKind.None,
      removeComments: true,
      target: ts.ScriptTarget.ES2024,
    },
    fileName: uri && uriBasename(uri),
    reportDiagnostics: true,
  });

  return output.diagnostics?.length ? [undefined, output.diagnostics] : [fix(output), undefined];

  function fix({ outputText }: ts.TranspileOutput) {
    return outputText.replace(
      /Object\.defineProperty\(exports, "__esModule", { value: true }\);/g,
      '',
    );
  }
}

export function transpileOrThrow(code: string, uri?: vscode.Uri): string {
  const [transpiledCode, diagnostics] = transpile(code, uri);
  if (diagnostics) {
    const error = new TranspilationError('Code transpilation failed.', diagnostics, uri);
    error.stack = '';
    throw error;
  }

  return transpiledCode;
}

export function extractInlineSourceMap(code: string) {
  const regex = /\/\/# sourceMappingURL=data:application\/json;base64,([^\n]+)/;
  const match = code.match(regex);
  if (!match) {
    return undefined;
  }

  const base64 = match[1];
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}

export class TranspilationError extends Error {
  public readonly diagnostics: ts.Diagnostic[];
  private recoverable?: boolean;
  public readonly uri?: vscode.Uri;

  constructor(message: string, diagnostics: ts.Diagnostic[], uri?: vscode.Uri) {
    super(message);
    this.name = 'TranspilationError';
    this.diagnostics = diagnostics;
    this.uri = uri;
  }

  [util.inspect.custom](_depth: number, options: util.InspectOptionsStylized) {
    const host: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: () =>
        this.uri ? parent(this.uri).toString() : ts.sys.getCurrentDirectory(),
      getCanonicalFileName: (fileName) =>
        ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
      getNewLine: () => ts.sys.newLine,
    };
    return options.colors
      ? ts.formatDiagnosticsWithColorAndContext(this.diagnostics, host)
      : ts.formatDiagnostics(this.diagnostics, host);
  }

  public isRecoverable(): boolean {
    if (this.recoverable === undefined) {
      const diag = this.diagnostics[0];
      switch (diag?.code) {
        case 1005:
          this.recoverable = !/'[:|;|,]' expected/.test(diag.messageText.toString());
          break;
        case 1109: // 1 +
          this.recoverable = true;
          break;
        default:
          this.recoverable = false;
          break;
      }
    }

    return this.recoverable;
  }
}
