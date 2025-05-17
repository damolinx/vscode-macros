
// @macro:persistent

var invocationCount;

async function main(invocation) {
  invocationCount ||= 0;

  await vscode.window.showInformationMessage(
    `Hello from call ${invocation}. Run this macro a couple of times before dismissing this message.`);
  await vscode.window.showInformationMessage(
    `Bye from call ${invocation}. You have made ${invocationCount} call(s) so far`);
}

main(++invocationCount);