
// @macro:retained,singleton

const CommandId = 'macro.helloWorld';

__disposables.push(
  vscode.commands.registerCommand(CommandId, () =>
    vscode.window.showInformationMessage('Hello World!')),
  vscode.languages.registerCodeLensProvider(
    { scheme: 'file', language: 'javascript' },
    {
      provideCodeLenses: () => [
        new vscode.CodeLens(
          new vscode.Range(0, 0, 0, 0),
          { title: 'Say Hi', command: CommandId })
      ]
    }
  ));