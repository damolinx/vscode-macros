import * as vscode from 'vscode';
import { generateCursorRule } from '../../ai/macroChatPrompt';

export async function createCursorRules() {
  const document = await vscode.workspace.openTextDocument({
    content: generateCursorRule(),
    language: 'markdown',
  });

  await vscode.window.showTextDocument(document, { preview: false });
}
