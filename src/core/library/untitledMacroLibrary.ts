import * as vscode from 'vscode';
import { isCreatingMacro } from '../../commands/createMacro';
import { ExtensionContext } from '../../extensionContext';
import { isUntitled, areUriEqual, UriLocator } from '../../utils/uri';
import { isMacroLangId } from '../language';
import { getMacroId, MacroId } from '../macroId';
import { MacroLibrary } from './macroLibrary';

export const UNTITLED_MACRO_LIBRARY_NAME = 'Temporary';

export class UntitledMacroLibrary extends MacroLibrary {
  private static _instance: UntitledMacroLibrary;

  public static instance(context: ExtensionContext): UntitledMacroLibrary {
    if (!context?.runnerManager) {
      throw new Error('Missing RunnerManager in context');
    }
    this._instance ??= new UntitledMacroLibrary(context);
    return this._instance;
  }

  private readonly untitledMacros: Map<MacroId, vscode.Uri>;

  private constructor({ runnerManager }: ExtensionContext) {
    super(vscode.Uri.from({ scheme: 'untitled', path: UNTITLED_MACRO_LIBRARY_NAME }), 'virtual');
    this.untitledMacros = new Map();

    this.disposables.push(
      runnerManager.onRun(({ macro }) => {
        if (this.owns(macro) && !this.untitledMacros.has(macro.id)) {
          this.untitledMacros.set(macro.id, macro.uri);
          this.onDidCreateMacroEmitter.fire(macro.uri);
        }
      }),
      runnerManager.onStop(({ runInfo: { macro } }) => {
        if (
          this.owns(macro) &&
          this.untitledMacros.has(macro.id) &&
          vscode.workspace.textDocuments.every(({ uri }) => !areUriEqual(uri, macro))
        ) {
          this.untitledMacros.delete(macro.id);
          this.onDidDeleteMacroEmitter.fire(macro.uri);
        }
      }),
      vscode.workspace.onDidOpenTextDocument(({ languageId, uri }) => {
        if (this.owns(uri) && (isCreatingMacro() || isMacroLangId(languageId))) {
          const macroId = getMacroId(uri);
          if (!this.untitledMacros.has(macroId)) {
            this.untitledMacros.set(macroId, uri);
            this.onDidCreateMacroEmitter.fire(uri);
          }
        }
      }),
      vscode.workspace.onDidChangeTextDocument(({ document: { uri } }) => {
        if (this.owns(uri) && this.untitledMacros.has(getMacroId(uri))) {
          this.onDidChangeMacroEmitter.fire(uri);
        }
      }),
      vscode.workspace.onDidCloseTextDocument(({ uri }) => {
        if (this.owns(uri)) {
          const macroId = getMacroId(uri);
          if (
            this.untitledMacros.has(macroId) &&
            runnerManager.getRunner(uri).runInstanceCount === 0
          ) {
            this.untitledMacros.delete(macroId);
            this.onDidDeleteMacroEmitter.fire(uri);
          }
        }
      }),
    );
  }

  public getFiles(): Promise<vscode.Uri[]> {
    return Promise.resolve([...this.untitledMacros.values()]);
  }

  public owns(locator: UriLocator): boolean {
    return isUntitled(locator);
  }
}
