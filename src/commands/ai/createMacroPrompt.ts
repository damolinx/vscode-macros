import * as vscode from 'vscode';
import { MacrosPrompt } from '../../ai/macroChatPrompt';
import { Context } from '../../context';

export async function createMacroPrompt(context: Context): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content: await MacrosPrompt.get(context),
    language: 'markdown',
  });

  await vscode.window.showTextDocument(document, { preview: false });
}
