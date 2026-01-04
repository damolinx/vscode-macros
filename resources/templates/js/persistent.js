
// @macro: persistent
//   persistent – shares the macro context across all instances of this macro

// Use `var` for globals in persistent macros; `let`/`const` redeclarations fail on reruns.
var invocationCount;

async function main() {
  invocationCount ??= 0;
  const invocation = ++invocationCount;

  await vscode.window.showInformationMessage(
    `Hello from invocation @${invocation}. Try running this macro multiple times!`
  );
}

main();