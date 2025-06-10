import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';

export class ExtensionContext implements vscode.Disposable {
  private _mruMacro?: vscode.Uri;
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly libraryManager: MacroLibraryManager;
  public readonly runnerManager: MacroRunnerManager;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.libraryManager = new MacroLibraryManager();
    this.runnerManager = new MacroRunnerManager();
    this.runnerManager.onRun(({ macro: { uri } }) => {
      this._mruMacro = uri;
      vscode.commands.executeCommand('setContext', 'macros:mruSet', true);
    });
  }

  dispose() {
    this.libraryManager.dispose();
    this.runnerManager.dispose();
  }

  public get mruMacro(): vscode.Uri | undefined {
    return this._mruMacro;
  }
}