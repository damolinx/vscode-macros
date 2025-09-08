import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { LazyDisposable } from '../../utils/lazy';
import { MacroLibrary } from './macroLibrary';
import { MacroLibrarySourceManager } from './macroLibrarySourceManager';
import { UntitledMacroLibrary } from './untitledMacroLibrary';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export class MacroLibraryManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly onDidChangeLibrariesEmitter: vscode.EventEmitter<void>;
  private readonly persistentLibraries: LazyDisposable<readonly MacroLibrary[]>;
  private readonly sourcesManager: MacroLibrarySourceManager;
  private readonly virtualLibraries: LazyDisposable<readonly MacroLibrary[]>;

  constructor(context: ExtensionContext) {
    this.onDidChangeLibrariesEmitter = new vscode.EventEmitter();
    this.persistentLibraries = new LazyDisposable(() =>
      this.sourcesManager.sources.map(
        (source) => new MacroLibrary(source.uri, 'configured', source),
      ),
    );
    this.sourcesManager = new MacroLibrarySourceManager(SOURCE_DIRS_CONFIG);
    this.virtualLibraries = new LazyDisposable(() => [UntitledMacroLibrary.instance(context)]);

    this.disposables = [
      this.onDidChangeLibrariesEmitter,
      this.persistentLibraries,
      this.sourcesManager,
      this.virtualLibraries,
      this.sourcesManager.onDidChangeSources(() => {
        this.persistentLibraries.reset();
        this.onDidChangeLibrariesEmitter.fire();
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
    return [...this.persistentLibraries.get(), ...this.virtualLibraries.get()];
  }

  public libraryFor(uri: vscode.Uri): MacroLibrary | undefined {
    return this.libraries.find((lib) => lib.owns(uri));
  }

  public get onDidChangeLibraries(): vscode.Event<void> {
    return this.onDidChangeLibrariesEmitter.event;
  }
}
