import * as vscode from 'vscode';
import { MACRO_LANGUAGES } from './core/constants';
import { ExtensionContext } from './extensionContext';
import { uriEqual } from './utils/uri';

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
  const contextKey = 'macros:supportedEditorLangId';
  setContext(contextKey, isSupported(vscode.window.activeTextEditor));

  return [
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      setContext(contextKey, isSupported(editor));
    }),
    vscode.workspace.onDidOpenTextDocument((document) => {
      const { activeTextEditor } = vscode.window;
      if (activeTextEditor && uriEqual(document.uri, activeTextEditor.document.uri)) {
        setContext(contextKey, isSupported(activeTextEditor));
      }
    }),
  ];

  function isSupported(editor?: vscode.TextEditor): boolean {
    return !!editor && MACRO_LANGUAGES.includes(editor.document.languageId);
  }
}

function setContext(contextKey: string, ...args: any[]) {
  vscode.commands.executeCommand('setContext', contextKey, ...args);
}
