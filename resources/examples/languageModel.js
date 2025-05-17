
// Learn about the Language Model API at https://code.visualstudio.com/api/extension-guides/language-model

async function main(invocation) {
  const [model] = await vscode.lm.selectChatModels();
  if (!model) {
    vscode.window.showErrorMessage("No chat model selected");
    return;
  }

  let question;
  while (question = (await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: `Ask anything to ${model.name} …`,
  },
    __cancellationToken))?.trim()) {
    const response = await model.sendRequest([vscode.LanguageModelChatMessage.User(question)]);

    let message = '';
    for await (const fragment of response.text) {
      message += fragment;
    }

    await vscode.window.showInformationMessage(message, { modal: true });
  }
}

main();
