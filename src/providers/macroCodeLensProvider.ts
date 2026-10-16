import * as vscode from 'vscode';
import { Context } from '../context';
import { FeatureEnabledSelector } from '../core/macroLanguages';
import { CodeSnapshot } from '../core/macros/code/codeSnapshot';

export function registerMacroCodeLensProvider(context: Context): void {
  context.disposables.push(
    vscode.languages.registerCodeLensProvider(FeatureEnabledSelector, new MacroCodeLensProvider()),
  );
}

/**
 * Provides a CodeLens to reset the context of a persistent macro.
 */
export class MacroCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    if (document.lineCount > 1 || !document.lineAt(0).isEmptyOrWhitespace) {
      const parsedMacroCode = new CodeSnapshot(document);
      if (parsedMacroCode.options.persistent) {
        lenses.push(
          new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
            title: 'Reset Context',
            command: 'macros.resetContext',
            arguments: [document.uri],
            tooltip: 'Reset persistent macro shared-data context',
          }),
        );
      }
    }

    return lenses;
  }
}
