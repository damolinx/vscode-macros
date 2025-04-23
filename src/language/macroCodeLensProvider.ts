import * as vscode from 'vscode';
import { parseOptions } from '../macroOptions';

export class MacroCodeLensProvider implements vscode.CodeLensProvider {

  provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    if (document.lineCount === 1 && document.lineAt(0).isEmptyOrWhitespace) {
      lenses.push(new vscode.CodeLens(
        new vscode.Range(0, 0, 0, 0),
        {
          title: 'Initialize',
          command: 'macros.new.macro.activeEditor',
          tooltip: 'Initialize from a macro template',
        },
      ));
    } else if (parseOptions(document.getText()).persistent) {
      lenses.push(new vscode.CodeLens(
        new vscode.Range(0, 0, 0, 0),
        {
          title: 'Reset Context',
          command: 'macros.resetContext',
          arguments: [document.uri],
          tooltip: 'Reset shared macro context',
        },
      ));
    }

    return lenses;
  }
}