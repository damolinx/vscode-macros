import * as vscode from 'vscode';
import { SandboxManager } from './core/execution/sandboxManager';
import { ViewManager } from './core/execution/views/viewManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';
import { StartupMacroLibrarySourceManager } from './core/library/startupMacroLibrarySourceManager';

export class ExtensionContext {
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly isRemote: boolean;
  public readonly libraryManager: MacroLibraryManager;
  public readonly log: vscode.LogOutputChannel;
  public mruMacro?: vscode.Uri;
  public readonly sandboxManager: SandboxManager;
  public readonly startupManager: StartupMacroLibrarySourceManager;
  public readonly treeViewManager: ViewManager;
  public readonly webviewManager: ViewManager;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.isRemote = Boolean(vscode.env.remoteName);
    this.log = vscode.window.createOutputChannel('Macros', { log: true });
    this.startupManager = new StartupMacroLibrarySourceManager();
    this.treeViewManager = new ViewManager('macrosView.treeview', 5);
    this.webviewManager = new ViewManager('macrosView.webview', 5);

    this.libraryManager = new MacroLibraryManager(this);
    this.sandboxManager = new SandboxManager(this);

    this.disposables.push(this.libraryManager, this.log, this.sandboxManager);
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
