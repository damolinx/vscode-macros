import * as vscode from 'vscode';
import { areUriEqual } from '../../utils/uri';
import { getMacroUriFromStartupMacroUri } from '../startupMacroId';
import { Source } from './source';
import { SourceManager } from './sourceManager';

export class StartupMacroLibrarySourceManager extends SourceManager {
  private static _instance: StartupMacroLibrarySourceManager;

  public static get instance(): StartupMacroLibrarySourceManager {
    this._instance ??= new StartupMacroLibrarySourceManager();
    return this._instance;
  }

  private readonly onDidChangeSourcesEmitter: vscode.EventEmitter<void>;

  private constructor() {
    super('macros.startupMacros');
    this.disposables.push(
      (this.onDidChangeSourcesEmitter = new vscode.EventEmitter()),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(this.configKey)) {
          this._sources.reset();
          this.onDidChangeSourcesEmitter.fire();
        }
      }),
    );
  }

  public override getLibrary(uri: vscode.Uri): Source | undefined {
    const targetUri = getMacroUriFromStartupMacroUri(uri);
    return this.sources.find((s) => areUriEqual(s.uri, targetUri));
  }

  public get onDidChangeSources(): vscode.Event<void> {
    return this.onDidChangeSourcesEmitter.event;
  }
}
