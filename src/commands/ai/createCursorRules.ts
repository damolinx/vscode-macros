import * as vscode from 'vscode';
import { CursorRule } from '../../ai/macroChatPrompt';
import { Context } from '../../context';

export async function createCursorRules(context: Context): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content: await CursorRule.get(context),
    language: 'markdown',
  });

  await vscode.window.showTextDocument(document, { preview: false });
}
