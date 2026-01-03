import * as vscode from 'vscode';
import { MacroLanguageId } from '../core/language/macroLanguage';
import { isMacroLanguage, PreferredLanguage, resolveMacroLanguage } from '../core/macroLanguages';
import { ExtensionContext } from '../extensionContext';
import { loadTemplates } from '../macroTemplates';
import { createGroupedQuickPickItems } from '../ui/ui';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { existsFile } from '../utils/fsEx';
import { isUntitled, areUriEqual, UriLocator, resolveUri } from '../utils/uri';
import { showTextDocument } from '../utils/vscodeEx';

let creatingMacro = false;

export function isCreatingMacro(): boolean {
  return creatingMacro;
}

export async function createMacro(
  context: ExtensionContext,
  locator?: UriLocator,
  options?: vscode.TextDocumentShowOptions & {
    content?: string;
    languageId?: MacroLanguageId;
  },
): Promise<vscode.TextDocument | undefined> {
  const languageId =
    options?.languageId ??
    vscode.workspace.getConfiguration().get('macros.templateDefaultLanguage', PreferredLanguage.id);

  const content = options?.content ?? (await getTemplateContent(context, languageId));
  if (content === undefined) {
    return;
  }

  let uri: vscode.Uri | undefined;
  if (locator !== undefined) {
    const parentUri = resolveUri(locator);
    if (!isUntitled(parentUri)) {
      uri = await createUntitledUri(parentUri, languageId);
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
      document = await vscode.workspace.openTextDocument({ content, language: languageId });
      await vscode.window.showTextDocument(document, options);
    }
    return document;
  } finally {
    creatingMacro = false;
  }

  async function createUntitledUri(parentUri: vscode.Uri, language: string, maxAttempts = 1000) {
    let uri: vscode.Uri | undefined;

    const extension = resolveMacroLanguage(language)?.defaultExtension ?? '';

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
  locator?: UriLocator,
  defaultContent?: string,
): Promise<void> {
  const editor = await (locator ? showTextDocument(resolveUri(locator)) : activeMacroEditor(false));
  if (!editor) {
    return;
  }

  let content = defaultContent;
  if (content === undefined) {
    const { languageId } = editor.document;
    if (isMacroLanguage(languageId)) {
      content = await getTemplateContent(context, languageId);
    }
  }
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
  languageId: MacroLanguageId,
): Promise<string | undefined> {
  const templates = await loadTemplates(context, languageId);
  const items = createGroupedQuickPickItems(templates, {
    groupBy: (template) => template.category ?? '',
    itemBuilder: ({ description, label, load }) => ({
      detail: description,
      label,
      load,
    }),
  });

  const { name } = resolveMacroLanguage(languageId);
  const selectedItem = await vscode.window.showQuickPick(items, {
    matchOnDescription: true,
    placeHolder: `Select a ${name} template`,
  });
  if (!selectedItem) {
    return;
  }

  const content = await selectedItem.load();
  return content;
}
