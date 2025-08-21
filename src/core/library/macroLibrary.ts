import * as vscode from 'vscode';
import { posix } from 'path';
import { uriBasename, uriDirname, UriLocator } from '../../utils/uri';
import { MACRO_EXTENSIONS, MACRO_FILE_GLOB } from '../constants';

export type MacroLibraryId = string;

export class MacroLibrary implements vscode.Disposable {
  protected readonly disposables: vscode.Disposable[];
  public readonly id: MacroLibraryId;
  public readonly name: string;
  protected readonly onDidCreateMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  protected readonly onDidChangeMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  protected readonly onDidDeleteMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  public readonly uri: vscode.Uri;
  private watcher?: vscode.FileSystemWatcher;

  constructor(uri: vscode.Uri, id: string = uri.toString(true)) {
    this.id = id;
    this.name = uriBasename(uri);
    this.uri = uri;

    this.onDidCreateMacroEmitter = new vscode.EventEmitter();
    this.onDidChangeMacroEmitter = new vscode.EventEmitter();
    this.onDidDeleteMacroEmitter = new vscode.EventEmitter();

    this.disposables = [
      this.onDidCreateMacroEmitter,
      this.onDidChangeMacroEmitter,
      this.onDidDeleteMacroEmitter,
      { dispose: () => this.watcher?.dispose() },
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  protected ensureWatcher() {
    if (!this.watcher && this.uri.scheme === 'file') {
      const pattern = new vscode.RelativePattern(this.uri, MACRO_FILE_GLOB);
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
      this.watcher.onDidCreate((uri) => this.onDidCreateMacroEmitter.fire(uri));
      this.watcher.onDidChange((uri) => this.onDidChangeMacroEmitter.fire(uri));
      this.watcher.onDidDelete((uri) => this.onDidDeleteMacroEmitter.fire(uri));
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

  public get onDidCreateMacro(): vscode.Event<vscode.Uri> {
    this.ensureWatcher();
    return this.onDidCreateMacroEmitter.event;
  }

  public get onDidChangeMacro(): vscode.Event<vscode.Uri> {
    this.ensureWatcher();
    return this.onDidChangeMacroEmitter.event;
  }

  public get onDidDeleteMacro(): vscode.Event<vscode.Uri> {
    this.ensureWatcher();
    return this.onDidDeleteMacroEmitter.event;
  }

  public owns(locator: UriLocator): boolean {
    const uri = locator instanceof vscode.Uri ? locator : locator.uri;
    return (
      this.uri.scheme === uri.scheme &&
      this.uri.authority == uri.authority &&
      this.uri.path === uriDirname(uri)
    );
  }
}
