
// @macro:persistent

// Global variables is shared across invocations of persistent macros
var invocationCount;

async function main() {
  invocationCount ??= 0;
  const invocation = ++invocationCount;

  await vscode.window.showInformationMessage(
    `Hello from invocation @${invocation}. Try running this macro multiple times!`
  );
}

main();