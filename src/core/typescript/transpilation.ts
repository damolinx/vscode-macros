import * as vscode from 'vscode';
import * as ts from 'typescript';
import { uriBasename } from '../../utils/uri';
import { TranspilationError } from './transpilationError';

export { TranspilationError } from './transpilationError';

export type TranspileResult =
  | { code: string; diagnostics?: never }
  | { code?: never; diagnostics: ts.Diagnostic[] };

export function transpile(input: string, uri?: vscode.Uri): TranspileResult {
  const { diagnostics, outputText } = ts.transpileModule(input, {
    compilerOptions: {
      inlineSourceMap: true,
      module: ts.ModuleKind.None,
      removeComments: true,
      target: ts.ScriptTarget.ES2024,
    },
    fileName: uri && uriBasename(uri),
    reportDiagnostics: true,
  });

  return diagnostics?.length ? { diagnostics } : { code: stripModuleDefine(outputText) };

  function stripModuleDefine(outputText: string): string {
    return outputText.replace(
      /Object\.defineProperty\s*\(\s*exports\s*,\s*"__esModule"\s*,\s*{\s*value:\s*true\s*}\s*\);?/g,
      '',
    );
  }
}

export function transpileOrThrow(input: string, uri?: vscode.Uri): string {
  const { code, diagnostics } = transpile(input, uri);
  if (diagnostics) {
    const message = ts.flattenDiagnosticMessageText(diagnostics[0].messageText, ts.sys.newLine);
    const error = new TranspilationError(message, diagnostics, uri);
    throw error;
  }
  return code;
}
