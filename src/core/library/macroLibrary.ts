import * as vscode from 'vscode';
import { posix } from 'path';
import { uriBasename } from '../../utils/uri';
import { MACRO_EXTENSIONS, MACRO_FILE_GLOB } from '../constants';

export type MacroLibraryId = string;

export class MacroLibrary implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  public readonly id: MacroLibraryId;
  public readonly name: string;
  private readonly onDidCreateMacrosEmitter: vscode.EventEmitter<vscode.Uri>;
  private readonly onDidDeleteMacrosEmitter: vscode.EventEmitter<vscode.Uri>;
  public readonly uri: vscode.Uri;
  private watcher?: vscode.FileSystemWatcher;

  constructor(uri: vscode.Uri) {
    this.id = uri.toString(true);
    this.name = uriBasename(uri);
    this.uri = uri;

    this.onDidCreateMacrosEmitter = new vscode.EventEmitter();
    this.onDidDeleteMacrosEmitter = new vscode.EventEmitter();

    this.disposables = [
      this.onDidCreateMacrosEmitter,
      this.onDidDeleteMacrosEmitter,
      { dispose: () => this.watcher?.dispose() },
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  private ensureWatcher() {
    if (!this.watcher && this.uri.scheme === 'file') {
      const pattern = new vscode.RelativePattern(this.uri, MACRO_FILE_GLOB);
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
      this.watcher.onDidCreate((uri) => this.onDidCreateMacrosEmitter.fire(uri));
      this.watcher.onDidDelete((uri) => this.onDidDeleteMacrosEmitter.fire(uri));
    }
  }

  public async getFiles(): Promise<vscode.Uri[]> {
    const entries = await vscode.workspace.fs.readDirectory(this.uri).then(
      (entries) => entries,
      (_error) => [],
    );
    return entries
      .filter(
        ([name, type]) =>
          (type === vscode.FileType.File || type === vscode.FileType.SymbolicLink) &&
          MACRO_EXTENSIONS.includes(posix.extname(name)),
      )
      .map(([name, _]) => vscode.Uri.joinPath(this.uri, name));
  }

  public get onDidCreateMacros(): vscode.Event<vscode.Uri> {
    this.ensureWatcher();
    return this.onDidCreateMacrosEmitter.event;
  }

  public get onDidDeleteMacros(): vscode.Event<vscode.Uri> {
    this.ensureWatcher();
    return this.onDidDeleteMacrosEmitter.event;
  }
}
