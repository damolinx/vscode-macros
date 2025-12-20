import * as vscode from 'vscode';
import * as util from 'util';
import * as ts from 'typescript';
import { parentUri } from '../../utils/uri';

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
        this.uri ? parentUri(this.uri).fsPath : ts.sys.getCurrentDirectory(),
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
      this.recoverable = this.diagnostics.every((diag: ts.Diagnostic): boolean => {
        switch (diag.code) {
          case 1005:
            return !/'[:|;|,]' expected/.test(diag.messageText.toString());
          case 1109:
            return true;
          default:
            return false;
        }
      });
    }

    return this.recoverable;
  }
}
