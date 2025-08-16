import * as vscode from 'vscode';
import { Lazy } from '../../utils/lazy';
import { MacroLibrary } from './macroLibrary';
import { expandConfigPaths } from './utils';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';

export class MacroLibraryManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[];
  public readonly libraries: Lazy<readonly MacroLibrary[]>;
  private readonly onDidChangeLibrariesEmitter: vscode.EventEmitter<void>;

  constructor() {
    this.libraries = new Lazy(() => {
      const expandedPaths = expandConfigPaths(SOURCE_DIRS_CONFIG);
      return expandedPaths.map((root) => new MacroLibrary(vscode.Uri.file(root)));
    });
    this.onDidChangeLibrariesEmitter = new vscode.EventEmitter();

    this.disposables = [
      this.onDidChangeLibrariesEmitter,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(SOURCE_DIRS_CONFIG)) {
          if (this.libraries.isInitialized()) {
            vscode.Disposable.from(...this.libraries.get()).dispose();
            this.libraries.reset();
          }
          this.onDidChangeLibrariesEmitter.fire();
        }
      }),
    ];
  }

  dispose() {
    if (this.libraries.isInitialized()) {
      this.disposables.push(...this.libraries.get());
    }
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public get onDidChangeLibraries(): vscode.Event<void> {
    return this.onDidChangeLibrariesEmitter.event;
  }

  public async getFiles(): Promise<Record<string, vscode.Uri[]>> {
    const allFiles: Record<string, vscode.Uri[]> = {};
    for (const library of this.libraries.get()) {
      const files = await library.getFiles();
      if (files.length) {
        allFiles[library.uri.fsPath] = files;
      }
    }
    return allFiles;
  }
}
