import * as vscode from 'vscode';
import { MACROS_EXT_DEBUG_VAR } from './commands/debugMacro';
import { isFeatureEnabled, isMacroLangId } from './core/language';
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

  context.disposables.push(
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
  setSupportedFromEditor(editor);

  context.disposables.push(
    // This is needed to support changing Language on current editor
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && areUriEqual(doc.uri, editor.document.uri)) {
        setSupportedFromEditor(editor);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => setSupportedFromEditor(editor)),
  );

  function setSupportedFromEditor(editor?: vscode.TextEditor) {
    const supportedLangId = !!editor && isMacroLangId(editor.document.languageId);
    const supportedFeatureExt =
      supportedLangId &&
      (isFeatureEnabled(editor.document.uri) ||
        !!context.libraryManager.libraryFor(editor.document.uri));

    setContext(supportedExtKey, supportedFeatureExt);
    setContext(supportedLangKey, supportedLangId);
  }
}

function setContext<T>(contextKey: string, arg: T) {
  vscode.commands.executeCommand('setContext', contextKey, arg);
}
