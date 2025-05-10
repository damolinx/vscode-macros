
const { basename } = require('path');

vscode.window.showInformationMessage(
  `Hello, World! This is ${basename(macros.macro.uri.fsPath)}.`,
  { modal: true },
);