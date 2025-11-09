import * as vscode from 'vscode';
import { isMacroLangId, MACRO_LANGUAGES, MACRO_PREFERRED_LANGUAGE } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { templates } from '../macroTemplates';
import { createGroupedQuickPickItems } from '../ui/ui';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { existsFile } from '../utils/fsEx';
import { fromLocator, isUntitled, Locator, toUri, areUriEqual } from '../utils/uri';

let creatingMacro = false;

export function isCreatingMacro(): boolean {
  return creatingMacro;
}

export async function createMacro(
  context: ExtensionContext,
  locator?: Locator,
  options?: vscode.TextDocumentShowOptions & {
    content?: string;
    language?: string;
  },
): Promise<vscode.TextDocument | undefined> {
  const language =
    options?.language ??
    vscode.workspace
      .getConfiguration()
      .get('macros.templateDefaultLanguage', MACRO_PREFERRED_LANGUAGE) ??
    MACRO_PREFERRED_LANGUAGE;

  const content = options?.content ?? (await getTemplateContent(context, language));
  if (content === undefined) {
    return;
  }

  let uri: vscode.Uri | undefined;
  if (locator !== undefined) {
    const parentUri = toUri(fromLocator(locator));
    if (!isUntitled(parentUri)) {
      uri = await createUntitledUri(parentUri, language);
    }
  }

  creatingMacro = true;
  try {
    let document: vscode.TextDocument;
    if (uri) {
      document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document, options);
      if (content) {
        await editor.edit((editBuilder) => editBuilder.insert(new vscode.Position(0, 0), content));
      }
    } else {
      document = await vscode.workspace.openTextDocument({ content, language });
      await vscode.window.showTextDocument(document, options);
    }
    return document;
  } finally {
    creatingMacro = false;
  }

  async function createUntitledUri(parentUri: vscode.Uri, language: string, maxAttempts = 1000) {
    let uri: vscode.Uri | undefined;

    const extension = isMacroLangId(language) ? MACRO_LANGUAGES[language].defaultExtension : '';

    for (let i = 1; !uri && i <= maxAttempts; i++) {
      const fsCandidate = vscode.Uri.joinPath(parentUri, `Untitled-${i}${extension}`);
      if (!(await existsFile(fsCandidate))) {
        const untitledCandidate = fsCandidate.with({ scheme: 'untitled' });
        if (
          !vscode.workspace.textDocuments.some(({ uri }) => areUriEqual(uri, untitledCandidate))
        ) {
          uri = untitledCandidate;
        }
      }
    }
    return uri;
  }
}

export async function updateEditor(
  context: ExtensionContext,
  documentLocator?: Locator,
  defaultContent?: string,
): Promise<void> {
  const editor = documentLocator
    ? await vscode.window.showTextDocument(toUri(fromLocator(documentLocator)))
    : await activeMacroEditor(false);
  if (!editor) {
    return;
  }

  const content = defaultContent ?? (await getTemplateContent(context, editor.document.languageId));
  if (!content) {
    return;
  }

  await editor.edit((editBuilder) =>
    editBuilder.replace(
      new vscode.Range(
        new vscode.Position(0, 0),
        editor.document.lineAt(editor.document.lineCount - 1).range.end,
      ),
      content,
    ),
  );
}

async function getTemplateContent(
  context: ExtensionContext,
  language?: string,
): Promise<string | undefined> {
  const selectedTemplate = await vscode.window.showQuickPick(
    createGroupedQuickPickItems(await templates(context, language), {
      groupBy: (template) => template.category ?? '',
      itemBuilder: (template) => ({
        label: template.label,
        description: template.description,
        template,
      }),
    }),
    {
      matchOnDescription: true,
      placeHolder: `Select a template (${language})`,
    },
  );
  if (!selectedTemplate) {
    return;
  }

  const content = await selectedTemplate.template.load();
  return content;
}
