import * as vscode from 'vscode';

export class MacroCodeLensProvider implements vscode.CodeLensProvider {

  provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    if (document.getText().length === 0) {
      lenses.push(new vscode.CodeLens(
        new vscode.Range(0, 0, 0, 0),
        {
          title: 'Initialize',
          command: 'macros.new.macro.activeEditor',
          tooltip: 'Initialize from a macro template'
        }
      ));
    }

    return lenses;
  }
}