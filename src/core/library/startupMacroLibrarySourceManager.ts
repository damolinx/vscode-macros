import * as vscode from 'vscode';
import { areUriEqual } from '../../utils/uri';
import { getMacroUriFromStartupMacroUri } from '../startupMacroId';
import { Source } from './source';
import { SourceManager } from './sourceManager';

export const STARTUP_MACROS_CONFIG = 'macros.startupMacros';

export class StartupMacroLibrarySourceManager extends SourceManager {
  private readonly onDidChangeSourcesEmitter: vscode.EventEmitter<void>;

  constructor() {
    super(STARTUP_MACROS_CONFIG);
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

  public override getSource(uri: vscode.Uri): Source | undefined {
    const targetUri = getMacroUriFromStartupMacroUri(uri);
    return this.sources.find((s) => areUriEqual(s.uri, targetUri));
  }

  public get onDidChangeSources(): vscode.Event<void> {
    return this.onDidChangeSourcesEmitter.event;
  }
}
