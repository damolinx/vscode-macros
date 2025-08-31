import * as vscode from 'vscode';
import { isMacroFeaturePath, isMacroLangId } from './core/language';
import { ExtensionContext } from './extensionContext';

export function registerSetContextHandlers(context: ExtensionContext): vscode.Disposable[] {
  return [registerMruSet(context), ...registerSupportedEditorLangId()];
}

function registerMruSet(context: ExtensionContext): vscode.Disposable {
  const contextKey = 'macros:mruSet';

  return context.runnerManager.onRun(({ macro: { uri } }) => {
    context.mruMacro = uri;
    setContext(contextKey, true);
  });
}

function registerSupportedEditorLangId(): vscode.Disposable[] {
  const supportedExtKey = 'macros:supportedFeatureExt';
  const supportedLangKey = 'macros:supportedEditorLangId';

  const supportHandler = (editorOrDoc?: vscode.TextEditor | vscode.TextDocument) => {
    const doc = editorOrDoc && 'document' in editorOrDoc ? editorOrDoc.document : editorOrDoc;
    const supportedLangId = !!doc && isMacroLangId(doc.languageId);
    const supportedFeatureExt = supportedLangId && isMacroFeaturePath(doc.fileName);

    setContext(supportedExtKey, supportedFeatureExt);
    setContext(supportedLangKey, supportedLangId);
  };

  supportHandler(vscode.window.activeTextEditor);
  return [
    vscode.window.onDidChangeActiveTextEditor(supportHandler),
    vscode.workspace.onDidOpenTextDocument(supportHandler),
  ];
}

function setContext(contextKey: string, ...args: any[]) {
  vscode.commands.executeCommand('setContext', contextKey, ...args);
}
