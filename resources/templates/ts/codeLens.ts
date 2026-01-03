// @ts-nocheck
// @macro:retained,singleton
import * as vscode from 'vscode';

const CommandId = 'macro.helloWorld';

__disposables.push(
  vscode.commands.registerCommand(CommandId, () =>
    vscode.window.showInformationMessage('Hello World!')),
  vscode.languages.registerCodeLensProvider(
    { scheme: 'file', language: 'typescript' },
    {
      provideCodeLenses(document, token) {
        return [
          new vscode.CodeLens(
            new vscode.Range(0, 0, 0, 0),
            { title: 'Say Hi', command: CommandId })
        ];
      }
    }
  ));