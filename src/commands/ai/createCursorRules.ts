import * as vscode from 'vscode';
import { CursorRule } from '../../ai/macroChatPrompt';
import { ExtensionContext } from '../../extensionContext';

export async function createCursorRules(context: ExtensionContext): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content: await CursorRule.get(context),
    language: 'markdown',
  });

  await vscode.window.showTextDocument(document, { preview: false });
}
