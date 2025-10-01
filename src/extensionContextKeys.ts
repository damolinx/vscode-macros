import * as vscode from 'vscode';
import { MACROS_EXT_DEBUG_VAR } from './commands/debugMacro';
import { isFeatureEnabledMacro, isMacroLangId } from './core/language';
import { ExtensionContext } from './extensionContext';
import { areUriEqual } from './utils/uri';

export function registerSetContextHandlers(context: ExtensionContext): vscode.Disposable[] {
  return [
    registerInDebugMode(context),
    registerMruSet(context),
    registerSupportedEditorLangId(),
  ].flat();
}

function registerInDebugMode({ log }: ExtensionContext): vscode.Disposable[] {
  const contextKey = 'macros:inDebugMode';
  const inDebugMode = process.env[MACROS_EXT_DEBUG_VAR]?.trim();
  if (inDebugMode) {
    log.warn('Running macros in Debug Mode');
    setContext(contextKey, inDebugMode);
  }
  return [];
}

function registerMruSet(context: ExtensionContext): vscode.Disposable[] {
  const contextKey = 'macros:mruSet';

  return [
    context.runnerManager.onRun(({ macro: { uri } }) => {
      context.mruMacro = uri;
      setContext(contextKey, true);
    }),
  ];
}

function registerSupportedEditorLangId(): vscode.Disposable[] {
  const supportedExtKey = 'macros:supportedFeatureExt';
  const supportedLangKey = 'macros:supportedEditorLangId';

  const supportHandler = (doc: vscode.TextDocument) => {
    const supportedLangId = isMacroLangId(doc.languageId);
    const supportedFeatureExt = supportedLangId && isFeatureEnabledMacro(doc.uri);

    setContext(supportedExtKey, supportedFeatureExt);
    setContext(supportedLangKey, supportedLangId);
  };

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    supportHandler(editor.document);
  }

  return [
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && areUriEqual(doc.uri, editor.document.uri)) {
        supportHandler(editor.document);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        supportHandler(editor.document);
      }
    }),
  ];
}

function setContext(contextKey: string, ...args: any[]) {
  vscode.commands.executeCommand('setContext', contextKey, ...args);
}
