// @ts-nocheck
// @macro:persistent

// Global variables are shared across invocations of persistent macros
var invocationCount: number | undefined;

async function main() {
  invocationCount ??= 0;
  const invocation = ++invocationCount;

  // `vscode` is injected by the macro host at runtime. IntelliSense only sees
  // it after saving this macro to a library (due to d.ts file) so `@ts-ignore`
  // is used here to silence TypeScript errors for a clean run. 
  // Importing `vscode` is not possible in persistent macrosas it would try to
  // redefine the symbol in subsequent runs.
  // @ts-ignore
  await vscode.window.showInformationMessage(
    `Hello from invocation #${invocation}. Try running this macro multiple times!`
  );
}

main();