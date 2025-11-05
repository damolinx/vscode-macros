import * as vscode from 'vscode';
import { MacroRunnerManager } from './core/execution/macroRunnerManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';
import { ViewManager } from './core/execution/viewManager';

export class ExtensionContext {
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly isRemote: boolean;
  public readonly libraryManager: MacroLibraryManager;
  public readonly log: vscode.LogOutputChannel;
  public mruMacro?: vscode.Uri;
  public readonly runnerManager: MacroRunnerManager;
  public readonly treeViewManager: ViewManager;
  public readonly webviewManager: ViewManager;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.isRemote = Boolean(vscode.env.remoteName);
    this.libraryManager = new MacroLibraryManager(this);
    this.log = vscode.window.createOutputChannel('Macros', { log: true });
    this.runnerManager = new MacroRunnerManager(this);
    this.treeViewManager = new ViewManager('macrosView.treeview', 3);
    this.webviewManager = new ViewManager('macrosView.webview', 3);

    this.disposables.push(this.libraryManager, this.log, this.runnerManager);
  }

  /**
   * An array to which disposables can be added. When this
   * extension is deactivated the disposables will be disposed.
   *
   * *Note* that asynchronous dispose-functions aren't awaited.
   */
  public get disposables(): vscode.Disposable[] {
    return this.extensionContext.subscriptions;
  }
}
