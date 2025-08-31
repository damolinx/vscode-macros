import * as vscode from 'vscode';
import { LazyDisposable } from '../../utils/lazy';
import { MacroLibrary } from './macroLibrary';
import { loadConfigUris } from './utils';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export class MacroLibraryManager implements vscode.Disposable {
  private readonly _libraries: LazyDisposable<readonly MacroLibrary[]>;
  private readonly disposables: vscode.Disposable[];
  private readonly onDidChangeLibrariesEmitter: vscode.EventEmitter<void>;

  constructor() {
    this._libraries = new LazyDisposable(() =>
      loadConfigUris(SOURCE_DIRS_CONFIG).map((root) => new MacroLibrary(root)),
    );
    this.onDidChangeLibrariesEmitter = new vscode.EventEmitter();

    this.disposables = [
      this._libraries,
      this.onDidChangeLibrariesEmitter,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(SOURCE_DIRS_CONFIG)) {
          this._libraries.reset();
          this.onDidChangeLibrariesEmitter.fire();
        }
      }),
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public async getFiles(): Promise<Record<string, vscode.Uri[]>> {
    const files = await Promise.all(
      this.libraries.map(async (lib) => [lib.uri.fsPath, await lib.getFiles()]),
    );
    return Object.fromEntries(files.filter(([_, files]) => files.length));
  }

  public get libraries(): readonly MacroLibrary[] {
    return this._libraries.get();
  }

  public libraryFor(uri: vscode.Uri): MacroLibrary | undefined {
    return this.libraries.find((lib) => lib.owns(uri));
  }

  public get onDidChangeLibraries(): vscode.Event<void> {
    return this.onDidChangeLibrariesEmitter.event;
  }
}
