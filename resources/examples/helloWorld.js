// @macro:persistent
var basename;
basename ||= require('path').basename;

var invocationCount;
invocationCount = invocationCount === undefined ? 1 : invocationCount + 1;

vscode.window.showInformationMessage(
  `Hello, World! This is ${basename(macros.macro.uri.fsPath)}. This message has been displayed ${invocationCount} time(s).`,
  { modal: true }
);