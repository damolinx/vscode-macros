import * as vscode from 'vscode';
import { MacroPreferredSelector } from '../core/language';
import { ExtensionContext } from '../extensionContext';

export function registerFillCodeLensProvider(context: ExtensionContext): void {
  context.disposables.push(
    vscode.languages.registerCodeLensProvider(MacroPreferredSelector, new FillCodeLensProvider()),
  );
}

/**
 * Provides a CodeLens to initialize empty files.
 */
export class FillCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    if (!isEmpty(document)) {
      return lenses;
    }

    lenses.push(
      new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
        title: 'Apply Template',
        command: 'macros.new.macro.activeEditor',
        arguments: [document.uri],
        tooltip: 'Replace file content with predefined template',
      }),
    );

    return lenses;
  }
}

function isEmpty(document: vscode.TextDocument): boolean {
  for (let i = 0; i < document.lineCount; i++) {
    if (!document.lineAt(i).isEmptyOrWhitespace) {
      return false;
    }
  }
  return true;
}
