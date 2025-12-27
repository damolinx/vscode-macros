import * as vscode from 'vscode';
import { ExtensionContext } from '../../extensionContext';
import { LazyDisposable } from '../../utils/lazy';
import { Library } from './library';
import { MacroLibrary } from './macroLibrary';
import { MacroLibrarySourceManager } from './macroLibrarySourceManager';
import { UntitledMacroLibrary } from './untitledMacroLibrary';

export class MacroLibraryManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  private readonly onDidChangeLibrariesEmitter: vscode.EventEmitter<void>;
  private readonly persistentLibraries: LazyDisposable<readonly MacroLibrary[]>;
  public readonly sourcesManager: MacroLibrarySourceManager;
  private readonly virtualLibraries: LazyDisposable<readonly Library[]>;

  constructor(context: ExtensionContext) {
    this.onDidChangeLibrariesEmitter = new vscode.EventEmitter();
    this.persistentLibraries = new LazyDisposable(() =>
      this.sourcesManager.sources.map((source) => new MacroLibrary(source.uri, source)),
    );
    this.sourcesManager = new MacroLibrarySourceManager();
    this.virtualLibraries = new LazyDisposable(() => [UntitledMacroLibrary.instance(context)]);

    this.disposables = [
      context.startupManager.onDidChangeSources(() => this.onDidChangeLibrariesEmitter.fire()),
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

  public get libraries(): readonly Library[] {
    return [...this.persistentLibraries.get(), ...this.virtualLibraries.get()];
  }

  public get onDidChangeLibraries(): vscode.Event<void> {
    return this.onDidChangeLibrariesEmitter.event;
  }

  public libraryFor(uri: vscode.Uri): Library | undefined {
    return this.libraries.find((lib) => lib.owns(uri));
  }
}
