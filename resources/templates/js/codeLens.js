
// @macro: retained, singleton
//   retained  – keeps the macro context alive until explicitly stopped
//   singleton – ensures only one macro instance runs at a time

const CommandId = 'macro.helloWorld';

// Ensures all registered components are disposed when the macro instance ends
__disposables.push(

  // Register a simple command that shows a message
  vscode.commands.registerCommand(CommandId, () =>
    vscode.window.showInformationMessage('Hello World!')),

  // Add a CodeLens that triggers the command at the top of JavaScript files
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