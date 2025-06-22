import * as vscode from 'vscode';
import { MacroLibrary } from './macroLibrary';
import { Lazy } from '../../utils/lazy';
import { expandConfigPaths } from './utils';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';


export class MacroLibraryManager implements vscode.Disposable {
  public readonly libraries: Lazy<readonly MacroLibrary[]>;
  private readonly onDidChangeConfigDisposable: vscode.Disposable;

  constructor() {
    this.libraries = new Lazy(() => this.getLibraries());
    this.onDidChangeConfigDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(SOURCE_DIRS_CONFIG)) {
        this.libraries.reset();
      }
    });
  }

  dispose() {
    this.onDidChangeConfigDisposable.dispose();
  }

  public async getFiles(): Promise<Record<string, vscode.Uri[]>> {
    const allFiles: Record<string, vscode.Uri[]> = {};
    for (const library of this.libraries.get()) {
      const files = await library.getFiles();
      if (files.length) {
        allFiles[library.root.fsPath] = files;
      }
    }
    return allFiles;
  }

  private getLibraries(): MacroLibrary[] {
    const expandedPaths = expandConfigPaths(SOURCE_DIRS_CONFIG);
    return expandedPaths.
      map((root) => new MacroLibrary(vscode.Uri.file(root)));
  }
}