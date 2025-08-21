import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';

export class ExtensionContext implements vscode.Disposable {
  private _mruMacro?: vscode.Uri;
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly isRemote: boolean;
  public readonly libraryManager: MacroLibraryManager;
  public readonly log: vscode.LogOutputChannel;
  public readonly runnerManager: MacroRunnerManager;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.isRemote = Boolean(vscode.env.remoteName);
    this.libraryManager = new MacroLibraryManager();
    this.log = vscode.window.createOutputChannel('Macros', { log: true });
    this.runnerManager = new MacroRunnerManager(this);
    this.runnerManager.onRun(({ macro: { uri } }) => {
      this._mruMacro = uri;
      vscode.commands.executeCommand('setContext', 'macros:mruSet', true);
    });
  }

  dispose() {
    this.libraryManager.dispose();
    this.runnerManager.dispose();

    // Dispose logger last
    this.log.dispose();
  }

  public get mruMacro(): vscode.Uri | undefined {
    return this._mruMacro;
  }
}
