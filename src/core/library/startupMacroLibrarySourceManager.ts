import * as vscode from 'vscode';
import { SourceManager } from './sourceManager';

export class StartupMacroLibrarySourceManager extends SourceManager {
  private static _instance: StartupMacroLibrarySourceManager;

  public static get instance(): StartupMacroLibrarySourceManager {
    this._instance ??= new StartupMacroLibrarySourceManager();
    return this._instance;
  }

  private constructor() {
    super('macros.startupMacros');
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(this.configKey)) {
          this._sources.reset();
        }
      }),
    );
  }
}
