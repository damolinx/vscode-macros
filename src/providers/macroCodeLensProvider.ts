import * as vscode from 'vscode';
import { MacroCode } from '../core/macroCode';
import { FeatureEnabledSelector } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';

export function registerMacroCodeLensProvider(context: ExtensionContext): void {
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
      const parsedMacroCode = new MacroCode(document);
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
