import * as vscode from 'vscode';
import { MACRO_EXTENSION, MACRO_LANGUAGE } from '../core/constants';
import { ExtensionContext } from '../extensionContext';
import { templates } from '../macroTemplates';
import { createGroupedQuickPickItems } from '../ui/ui';
import { activeMacroEditor } from '../utils/activeMacroEditor';
import { fromLocator, isUntitled, Locator, toUri, uriEqual } from '../utils/uri';

let creatingMacro = false;

export function isCreatingMacro(): boolean {
  return creatingMacro;
}

export async function createMacro(
  context: ExtensionContext,
  locator?: Locator,
  options?: vscode.TextDocumentShowOptions & {
    content?: string;
  },
): Promise<void> {
  const content = options?.content ?? (await getTemplateContent(context));
  if (!content) {
    return;
  }

  let uri: vscode.Uri | undefined;
  if (locator !== undefined) {
    const parentUri = toUri(fromLocator(locator));
    if (!isUntitled(parentUri)) {
      uri = await createUntitledUri(parentUri);
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
      document = await vscode.workspace.openTextDocument({
        language: MACRO_LANGUAGE,
        content,
      });
      await vscode.window.showTextDocument(document, options);
    }
  } finally {
    creatingMacro = false;
  }

  async function createUntitledUri(parentUri: vscode.Uri, maxAttempts = 1000) {
    let uri: vscode.Uri | undefined;
    for (let i = 1; !uri && i <= maxAttempts; i++) {
      const fsCandidate = vscode.Uri.joinPath(parentUri, `Untitled-${i}${MACRO_EXTENSION}`);
      if (
        await vscode.workspace.fs.stat(fsCandidate).then(
          () => false,
          () => true,
        )
      ) {
        const untitledCandidate = fsCandidate.with({ scheme: 'untitled' });
        if (!vscode.workspace.textDocuments.some(({ uri }) => uriEqual(uri, untitledCandidate))) {
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

  const content = defaultContent ?? (await getTemplateContent(context));
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

async function getTemplateContent(context: ExtensionContext): Promise<string | undefined> {
  const selectedTemplate = await vscode.window.showQuickPick(
    createGroupedQuickPickItems(await templates(context), {
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
    },
  );
  if (!selectedTemplate) {
    return;
  }

  const content = await selectedTemplate.template.load();
  return content;
}
