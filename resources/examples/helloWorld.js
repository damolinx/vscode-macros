// @macro:singleton
async function sayHello() {
  return vscode.window.showInformationMessage("Hello, World!");
}

sayHello();