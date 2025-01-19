// @macro:singleton
async function sayHello() {
  vscode.window.showInformationMessage("Hello, World!");
}

sayHello();