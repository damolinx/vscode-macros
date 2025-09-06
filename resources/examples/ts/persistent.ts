// @ts-nocheck
// @macro:persistent
import * as vscode from "vscode";

var invocationCount;

async function main() {
  invocationCount ??= 0;
  let invocation = ++invocationCount;

  await vscode.window.showInformationMessage(
    `Hello from call ${invocation}. Run this macro a couple of times before dismissing this message.`);
  await vscode.window.showInformationMessage(
    `Bye from call ${invocation}. You have made ${invocationCount} call(s) so far.`);
}

main();