
const { basename } = require('path');

async function main() {
  await vscode.window.showInformationMessage(
    `Hello, World! This is ${basename(macros.macro.uri.fsPath)}.`,
    { modal: true },
  );
  macros.log.info('Greeted the world');
}

main();