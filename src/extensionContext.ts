import * as vscode from 'vscode';
import { SandboxManager } from './core/execution/sandboxManager';
import { ViewManager } from './core/execution/views/viewManager';
import { MacroLibraryManager } from './core/library/macroLibraryManager';
import { StartupMacroLibrarySourceManager } from './core/library/startupMacroLibrarySourceManager';

export class ExtensionContext {
  public readonly extensionContext: vscode.ExtensionContext;
  public readonly libraryManager: MacroLibraryManager;
  public readonly log: vscode.LogOutputChannel;
  public mruMacro?: vscode.Uri;
  public readonly sandboxManager: SandboxManager;
  public readonly startupManager: StartupMacroLibrarySourceManager;
  public readonly viewManagers: Readonly<{ tree: ViewManager; web: ViewManager }>;

  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
    this.log = vscode.window.createOutputChannel('Macros', { log: true });
    this.startupManager = new StartupMacroLibrarySourceManager();
    this.viewManagers = {
      tree: new ViewManager('macrosView.treeview', 5),
      web: new ViewManager('macrosView.webview', 5),
    };

    this.libraryManager = new MacroLibraryManager(this);
    this.sandboxManager = new SandboxManager(this);
    this.disposables.push(this.libraryManager, this.log, this.sandboxManager, this.startupManager);
  }

  public get disposables(): vscode.Disposable[] {
    return this.extensionContext.subscriptions;
  }

  public get isRemote(): boolean {
    return Boolean(vscode.env.remoteName);
  }
}
