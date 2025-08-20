import * as vscode from 'vscode';
import { MACRO_EXTENSION } from '../core/constants';
import { MacroLibrary } from '../core/library/macroLibrary';
import { getMacroId, MacroId } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { isUntitled, uriEqual } from '../utils/uri';

export class UntitledMacroLibrary extends MacroLibrary {
  private readonly untitledMacros: Map<MacroId, vscode.Uri>;

  constructor(context: ExtensionContext) {
    super(vscode.Uri.parse('untitled:'), 'untitled-library');
    this.untitledMacros = new Map();

    this.disposables.push(
      context.runnerManager.onRun(({ macro }) => {
        if (isUntitled(macro) && !this.untitledMacros.has(macro.id)) {
          this.untitledMacros.set(macro.id, macro.uri);
          this.onDidCreateMacroEmitter.fire(macro.uri);
        }
      }),
      context.runnerManager.onStop(({ runInfo: { macro } }) => {
        if (
          isUntitled(macro) &&
          this.untitledMacros.has(macro.id) &&
          vscode.workspace.textDocuments.every(({ uri }) => !uriEqual(uri, macro.uri))
        ) {
          this.untitledMacros.delete(macro.id);
          this.onDidDeleteMacroEmitter.fire(macro.uri);
        }
      }),
      vscode.workspace.onDidOpenTextDocument(({ uri }) => {
        if (isUntitled(uri) && uri.path.endsWith(MACRO_EXTENSION)) {
          const macroId = getMacroId(uri);
          if (!this.untitledMacros.has(macroId)) {
            this.untitledMacros.set(macroId, uri);
            this.onDidCreateMacroEmitter.fire(uri);
          }
        }
      }),
      vscode.workspace.onDidChangeTextDocument(({ document: { uri } }) => {
        if (isUntitled(uri) && this.untitledMacros.has(getMacroId(uri))) {
          this.onDidChangeMacroEmitter.fire(uri);
        }
      }),
      vscode.workspace.onDidCloseTextDocument(({ uri }) => {
        if (isUntitled(uri)) {
          const macroId = getMacroId(uri);
          if (
            this.untitledMacros.has(macroId) &&
            context.runnerManager.getRunner(uri).runInstanceCount === 0
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
}
