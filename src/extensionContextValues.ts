import * as vscode from 'vscode';
import { MACROS_EXT_DEBUG_VAR } from './commands/debugMacro';
import { isFeatureEnabledMacro, isMacroLangId } from './core/language';
import { ExtensionContext } from './extensionContext';
import { areUriEqual } from './utils/uri';

export function registerContextValueHandlers(context: ExtensionContext): void {
  registerInDebugMode(context);
  registerMruSet(context);
  registerSupported(context);
}

function registerInDebugMode({ log }: ExtensionContext): void {
  const contextKey = 'macros:inDebugMode';
  const inDebugMode = process.env[MACROS_EXT_DEBUG_VAR]?.trim();

  if (inDebugMode) {
    log.warn('Running macros in Debug Mode');
    setContext(contextKey, inDebugMode);
  }
}

function registerMruSet(context: ExtensionContext): void {
  const contextKey = 'macros:mruSet';

  context.extensionContext.subscriptions.push(
    context.runnerManager.onRun(({ macro: { uri } }) => {
      context.mruMacro = uri;
      setContext(contextKey, true);
    }),
  );
}

function registerSupported(context: ExtensionContext): void {
  const supportedExtKey = 'macros:supportedFeatureExt';
  const supportedLangKey = 'macros:supportedEditorLangId';

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    setSupportedContext(editor.document);
  }

  context.extensionContext.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && areUriEqual(doc.uri, editor.document.uri)) {
        setSupportedContext(editor.document);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        setSupportedContext(editor.document);
      }
    }),
  );

  function setSupportedContext(doc: vscode.TextDocument) {
    const supportedLangId = isMacroLangId(doc.languageId);
    const supportedFeatureExt = supportedLangId && isFeatureEnabledMacro(doc.uri);

    setContext(supportedExtKey, supportedFeatureExt);
    setContext(supportedLangKey, supportedLangId);
  }
}

function setContext<T>(contextKey: string, arg: T) {
  vscode.commands.executeCommand('setContext', contextKey, arg);
}
