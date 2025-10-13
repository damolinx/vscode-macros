import * as vscode from 'vscode';
import { MACROS_EXT_DEBUG_VAR } from './commands/debugMacro';
import { isFeatureEnabledMacro, isMacroLangId } from './core/language';
import { ExtensionContext } from './extensionContext';
import { areUriEqual } from './utils/uri';

export function registerContextValueHandlers(context: ExtensionContext): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  registerInDebugMode(context, disposables);
  registerMruSet(context, disposables);
  registerSupported(context, disposables);
  return disposables;
}

function registerInDebugMode({ log }: ExtensionContext, _disposables: vscode.Disposable[]): void {
  const contextKey = 'macros:inDebugMode';
  const inDebugMode = process.env[MACROS_EXT_DEBUG_VAR]?.trim();

  if (inDebugMode) {
    log.warn('Running macros in Debug Mode');
    setContext(contextKey, inDebugMode);
  }
}

function registerMruSet(context: ExtensionContext, disposables: vscode.Disposable[]): void {
  const contextKey = 'macros:mruSet';

  disposables.push(
    context.runnerManager.onRun(({ macro: { uri } }) => {
      context.mruMacro = uri;
      setContext(contextKey, true);
    }),
  );
}

function registerSupported(_context: ExtensionContext, disposables: vscode.Disposable[]): void {
  const supportedExtKey = 'macros:supportedFeatureExt';
  const supportedLangKey = 'macros:supportedEditorLangId';

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    setSupportedContext(editor.document);
  }

  disposables.push(
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
