import * as vscode from 'vscode';
import { isCreatingMacro } from '../../commands/createMacro';
import { ExtensionContext } from '../../extensionContext';
import { isUntitled, UriLocator } from '../../utils/uri';
import { isMacroLangId } from '../language';
import { getMacroId } from '../macroId';
import { Library } from './library';

export const UNTITLED_MACRO_LIBRARY_NAME = 'Temporary';

export class UntitledMacroLibrary extends Library {
  private static _instance: UntitledMacroLibrary;

  public static instance(context: ExtensionContext): UntitledMacroLibrary {
    this._instance ??= new UntitledMacroLibrary(context);
    return this._instance;
  }

  private constructor({ sandboxManager }: ExtensionContext) {
    super(vscode.Uri.from({ scheme: 'untitled', path: UNTITLED_MACRO_LIBRARY_NAME }));

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(({ languageId, uri }) => {
        if (this.owns(uri) && (isCreatingMacro() || isMacroLangId(languageId))) {
          this.addItems({ id: getMacroId(uri), uri });
        }
      }),
      vscode.workspace.onDidChangeTextDocument(({ document: { uri } }) => {
        if (this.owns(uri)) {
          this.reportChangedItems(getMacroId(uri));
        }
      }),
      vscode.workspace.onDidCloseTextDocument(({ uri }) => {
        if (this.owns(uri) && sandboxManager.getExecutor(uri)?.executions) {
          this.removeItems(getMacroId(uri));
        }
      }),
    );
  }

  public override owns(locator: UriLocator): boolean {
    return isUntitled(locator);
  }
}
