import * as vscode from 'vscode';
import { isParent, uriBasename, UriLocator } from '../../utils/uri';
import { isMacro, macroGlobPattern } from '../language';
import { getMacroLibraryId, MacroLibraryId } from './macroLibraryId';
import { MacroLibrarySource } from './macroLibrarySource';

export type MacroLibraryKind = 'configured' | 'virtual';

export class MacroLibrary implements vscode.Disposable {
  public readonly configSource?: MacroLibrarySource;
  protected readonly disposables: vscode.Disposable[];
  public readonly id: MacroLibraryId;
  public readonly kind: MacroLibraryKind;
  public readonly name: string;
  protected readonly onDidCreateMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  protected readonly onDidChangeMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  protected readonly onDidDeleteMacroEmitter: vscode.EventEmitter<vscode.Uri>;
  public readonly uri: vscode.Uri;
  private watcher?: vscode.FileSystemWatcher;

  constructor(uri: vscode.Uri, kind: 'configured', configSource: MacroLibrarySource);
  constructor(uri: vscode.Uri, kind: 'virtual');
  constructor(uri: vscode.Uri, kind: MacroLibraryKind, configSource?: MacroLibrarySource) {
    this.configSource = configSource;
    this.id = getMacroLibraryId(uri);
    this.kind = kind;
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
      this.watcher = vscode.workspace.createFileSystemWatcher(macroGlobPattern(this.uri));
      this.watcher.onDidCreate((uri) => isMacro(uri) && this.onDidCreateMacroEmitter.fire(uri));
      this.watcher.onDidChange((uri) => isMacro(uri) && this.onDidChangeMacroEmitter.fire(uri));
      this.watcher.onDidDelete((uri) => isMacro(uri) && this.onDidDeleteMacroEmitter.fire(uri));
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
          (type === vscode.FileType.File || type === vscode.FileType.SymbolicLink) && isMacro(name),
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
    return isParent(this.uri, uri);
  }
}
