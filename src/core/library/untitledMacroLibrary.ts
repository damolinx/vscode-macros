import * as vscode from 'vscode';
import { isCreatingMacro } from '../../commands/createMacro';
import { ExtensionContext } from '../../extensionContext';
import { isUntitled } from '../../utils/uri';
import { getMacroId, MacroId } from '../macroId';
import { isMacroLanguage } from '../macroLanguages';
import { Library } from './library';
import { getMacroItem } from './macroLibraryItem';

export const UNTITLED_MACRO_LIBRARY_NAME = 'Temporary';

export class UntitledMacroLibrary extends Library<MacroId> {
  private static _instance: UntitledMacroLibrary;

  public static instance(context: ExtensionContext): UntitledMacroLibrary {
    this._instance ??= new UntitledMacroLibrary(context);
    return this._instance;
  }

  private constructor({ sandboxManager }: ExtensionContext) {
    super(vscode.Uri.from({ scheme: 'untitled', path: UNTITLED_MACRO_LIBRARY_NAME }));
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (this.ownsDocument(document) || isCreatingMacro()) {
          this.addItems(getMacroItem(document.uri));
        }
      }),
      vscode.workspace.onDidChangeTextDocument(({ document: { uri } }) => {
        if (this.owns(uri)) {
          this.reportChangedItems(getMacroId(uri));
        }
      }),
      vscode.workspace.onDidCloseTextDocument(({ uri }) => {
        if (this.owns(uri)) {
          const executor = sandboxManager.getExecutor(uri);
          if (executor?.isRunning()) {
            const disposable = executor.onExecutionEnd(() => {
              if (!executor.isRunning()) {
                this.removeItems(getMacroId(uri));
                disposable.dispose();
              }
            });
          } else {
            this.removeItems(getMacroId(uri));
          }
        }
      }),
    );
    const editor = vscode.window.activeTextEditor;
    if (editor && this.ownsDocument(editor.document)) {
      this.addItems(getMacroItem(editor.document.uri));
    }
  }

  public override owns(uri: vscode.Uri): boolean {
    return isUntitled(uri);
  }

  private ownsDocument({ languageId, uri }: vscode.TextDocument): boolean {
    return this.owns(uri) && isMacroLanguage(languageId);
  }
}
