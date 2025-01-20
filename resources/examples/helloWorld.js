// @macro:singleton
const { basename } = require('path');

async function sayHello() {
  const from = basename(macros.macro.uri.fsPath);
  return vscode.window.showInformationMessage(`Hello, World! From ${from}`, { modal: true });
}

sayHello();