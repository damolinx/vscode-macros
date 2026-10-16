import * as vscode from 'vscode';
import { MACROS_EXT_DEBUG_VAR } from './commands/debugMacro';
import { Context } from './context';
import { isFeatureMacro, isMacroLanguage } from './core/macroLanguages';
import { areUriEqual } from './utils/uri';

export function registerContextValueHandlers(context: Context): void {
  registerInDebugMode(context);
  registerMruSet(context);
  registerSupported(context);
}

async function registerInDebugMode({ log }: Context): Promise<void> {
  const contextKey = 'macros:inDebugMode';
  const inDebugMode = process.env[MACROS_EXT_DEBUG_VAR]?.trim();

  if (inDebugMode) {
    log.warn('Running macros in Debug Mode');
    await setContextValue(contextKey, inDebugMode);
  }
}

async function registerMruSet(context: Context): Promise<void> {
  const contextKey = 'macros:mruSet';

  context.disposables.push(
    context.executorManager.onExecutionStart(async ({ macro: { uri } }) => {
      context.mruMacro = uri;
      await setContextValue(contextKey, true);
    }),
  );
}

async function registerSupported(context: Context): Promise<void> {
  const supportedExtKey = 'macros:supportedFeatureExt';
  const supportedLangKey = 'macros:supportedEditorLangId';

  const editor = vscode.window.activeTextEditor;
  setSupportedFromEditor(editor);

  context.disposables.push(
    // This is needed to support changing Language on current editor
    vscode.workspace.onDidOpenTextDocument(({ uri }) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && areUriEqual(uri, editor.document.uri)) {
        setSupportedFromEditor(editor);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => setSupportedFromEditor(editor)),
  );

  async function setSupportedFromEditor(editor?: vscode.TextEditor): Promise<void> {
    const supportedLangId = !!editor && isMacroLanguage(editor.document.languageId);
    const supportedFeatureExt =
      supportedLangId &&
      (isFeatureMacro(editor.document.uri) ||
        !!context.libraryManager.libraryFor(editor.document.uri));

    await setContextValue(supportedExtKey, supportedFeatureExt);
    await setContextValue(supportedLangKey, supportedLangId);
  }
}

export async function setContextValue<T>(contextKey: string, arg: T): Promise<void> {
  await vscode.commands.executeCommand('setContext', contextKey, arg);
}
