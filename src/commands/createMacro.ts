import * as vscode from 'vscode';
import { MACRO_PREFERRED_LANGUAGE, tryResolveMacroLanguageFromId } from '../core/language';
import { ExtensionContext } from '../extensionContext';
import { templates } from '../macroTemplates';
import { createGroupedQuickPickItems } from '../ui/ui';
import { activeMacroEditor } from '../utils/activeMacroEditor';
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
): Promise<void> {
  let content: string | undefined;
  const language =
    vscode.workspace
      .getConfiguration()
      .get('macros.templateDefaultLanguage', MACRO_PREFERRED_LANGUAGE) ?? MACRO_PREFERRED_LANGUAGE;
  if (options?.content !== undefined) {
    content = options.content;
  } else {
    content = await getTemplateContent(context, language);
  }

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
  } finally {
    creatingMacro = false;
  }

  async function createUntitledUri(parentUri: vscode.Uri, language: string, maxAttempts = 1000) {
    let uri: vscode.Uri | undefined;
    const macroLang = tryResolveMacroLanguageFromId(language);
    const extension = macroLang ? `.${macroLang.extensions[0]}` : '';
    for (let i = 1; !uri && i <= maxAttempts; i++) {
      const fsCandidate = vscode.Uri.joinPath(parentUri, `Untitled-${i}${extension}`);
      if (
        await vscode.workspace.fs.stat(fsCandidate).then(
          () => false,
          () => true,
        )
      ) {
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

export async function updateActiveEditor(
  context: ExtensionContext,
  defaultContent?: string,
): Promise<void> {
  const editor = await activeMacroEditor(false);
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
