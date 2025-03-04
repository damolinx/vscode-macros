
import * as vscode from 'vscode';
import { MACRO_LANGUAGE } from '../constants';
import { templates } from '../macroTemplates';

export async function createMacro(context: vscode.ExtensionContext): Promise<vscode.TextEditor | undefined> {
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
    language: MACRO_LANGUAGE,
    content: await selectedTemplate.load(),
  });

  const editor = await vscode.window.showTextDocument(document);
  return editor;
}
