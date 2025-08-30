import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';

export class ExtensionContext implements vscode.Disposable {
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly isRemote: boolean;
  public readonly libraryManager: MacroLibraryManager;
  public readonly log: vscode.LogOutputChannel;
  public mruMacro?: vscode.Uri;
  public readonly runnerManager: MacroRunnerManager;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.isRemote = Boolean(vscode.env.remoteName);
    this.libraryManager = new MacroLibraryManager();
    this.log = vscode.window.createOutputChannel('Macros', { log: true });
    this.runnerManager = new MacroRunnerManager(this);
  }

  dispose() {
    this.libraryManager.dispose();
    this.runnerManager.dispose();

    // Dispose logger last
    this.log.dispose();
  }
}
