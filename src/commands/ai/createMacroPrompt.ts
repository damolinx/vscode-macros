import * as vscode from 'vscode';
import { MacrosPrompt } from '../../ai/macroChatPrompt';
import { ExtensionContext } from '../../extensionContext';

export async function createMacroPrompt(context: ExtensionContext): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content: await MacrosPrompt.get(context),
    language: 'markdown',
  });

  await vscode.window.showTextDocument(document, { preview: false });
}
