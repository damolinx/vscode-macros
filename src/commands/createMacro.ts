
import * as vscode from 'vscode';
import { MACRO_LANGUAGE } from '../core/constants';
import { templates } from '../macroTemplates';
import { createGroupedQuickPickItems } from '../ui/ui';
import { activeMacroEditor } from '../utils/activeMacroEditor';

export async function createMacro(context: vscode.ExtensionContext, defaultContent?: string, options?: vscode.TextDocumentShowOptions): Promise<vscode.TextEditor | undefined> {
  const content = defaultContent ?? await getTemplateContent(context);
  if (!content) {
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    language: MACRO_LANGUAGE,
    content,
  });
  const editor = await vscode.window.showTextDocument(
    document,
    options);
  return editor;
}

export async function updateActiveEditor(context: vscode.ExtensionContext, defaultContent?: string): Promise<void> {
  const editor = await activeMacroEditor(false);
  if (!editor) {
    return;
  }

  const content = defaultContent ?? await getTemplateContent(context);
  if (!content) {
    return;
  }

  await editor.edit(editBuilder =>
    editBuilder.replace(
      new vscode.Range(
        new vscode.Position(0, 0),
        editor.document.lineAt(editor.document.lineCount - 1).range.end,
      ),
      content,
    ),
  );
}

async function getTemplateContent(context: vscode.ExtensionContext): Promise<string | undefined> {
  const selectedTemplate = await vscode.window.showQuickPick(
    createGroupedQuickPickItems(
      await templates(context),
      {
        groupBy: (template) => template.category ?? '',
        itemBuilder: (template) => ({
          label: template.label,
          description: template.description,
          template,
        }),
      }),
    {
      matchOnDescription: true,
      placeHolder: 'Select a macro template',
    });
  if (!selectedTemplate) {
    return;
  }

  const content = await selectedTemplate.template.load();
  return content;
}
