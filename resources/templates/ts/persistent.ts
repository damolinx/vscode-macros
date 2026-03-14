// @ts-nocheck
// @macro: persistent
//   persistent – shares the macro context across all instances of this macro

import * as vscode from 'vscode';

// Use `var` for globals in persistent macros; `let`/`const` redeclarations fail on reruns.
let invocationCount: number | undefined;

async function main(): Promise<void> {
  invocationCount ??= 0;
  const invocation = ++invocationCount;

  await vscode.window.showInformationMessage(
    `Hello from invocation @${invocation}. Try running this macro multiple times!`,
  );
}

main();
