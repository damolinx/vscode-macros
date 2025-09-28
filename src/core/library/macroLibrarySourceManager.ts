import * as vscode from 'vscode';
import { SourceManager } from './sourceManager';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export class MacroLibrarySourceManager extends SourceManager {
  private readonly onDidChangeSourcesEmitter: vscode.EventEmitter<void>;

  constructor() {
    super(SOURCE_DIRS_CONFIG);
    this.onDidChangeSourcesEmitter = new vscode.EventEmitter();

    this.disposables.push(
      this.onDidChangeSourcesEmitter,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(this.configKey)) {
          this._sources.reset();
          this.onDidChangeSourcesEmitter.fire();
        }
      }),
    );
  }

  public get onDidChangeSources(): vscode.Event<void> {
    return this.onDidChangeSourcesEmitter.event;
  }
}
