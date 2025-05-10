
// @macro:persistent

var invocationCount;
invocationCount ||= 0;

async function main(invocation) {
  await vscode.window.showInformationMessage(
    `Hello from call ${invocation}. Run this macro a couple of times before dismissing this message.`);
  await vscode.window.showInformationMessage(
    `Bye from call ${invocation}. You have made ${invocationCount} call(s) so far`);
}

main(++invocationCount);