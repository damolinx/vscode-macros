
import * as vscode from 'vscode';
import { templates } from '../macroTemplates';

export async function createMacro(context: vscode.ExtensionContext) {
  const selectedTemplate = await vscode.window.showQuickPick(
    await templates(context),
    {
      matchOnDescription: true,
      placeHolder: 'Select a macro template',
    });
  if (!selectedTemplate) {
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    language: 'javascript',
    content: await selectedTemplate.load(),
  });
  await vscode.window.showTextDocument(document);
}
