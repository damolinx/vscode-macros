import * as vscode from 'vscode';
import { isParent, UriLocator } from '../../utils/uri';
import { isMacro, macroGlobPattern } from '../language';
import { getMacroId } from '../macroId';
import { Library } from './library';
import { LibraryItem } from './libraryItem';
import { Source } from './source';

export class MacroLibrary extends Library {
  public readonly configSource?: Source;
  private initialized: boolean;
  private readonly watcher?: vscode.FileSystemWatcher;

  constructor(uri: vscode.Uri, configSource: Source) {
    super(uri);
    this.configSource = configSource;
    this.initialized = false;
    this.sorting = 0;

    if (this.uri.scheme === 'file') {
      this.watcher = vscode.workspace.createFileSystemWatcher(macroGlobPattern(this.uri));
      this.watcher.onDidCreate(
        (uri) => isMacro(uri) && this.addItems({ id: getMacroId(uri), uri }),
      );
      this.watcher.onDidChange((uri) => isMacro(uri) && this.reportChangedItems(getMacroId(uri)));
      this.watcher.onDidDelete((uri) => isMacro(uri) && this.removeItems(getMacroId(uri)));
    }

    this.disposables.push({ dispose: () => this.watcher?.dispose() });
  }

  public override async getFiles(): Promise<LibraryItem[]> {
    if (!this.initialized) {
      const entries = await vscode.workspace.fs.readDirectory(this.uri).then(
        (entries) =>
          entries
            .filter(
              ([name, type]) =>
                (type === vscode.FileType.File || type === vscode.FileType.SymbolicLink) &&
                isMacro(name),
            )
            .map(([name, _]) => vscode.Uri.joinPath(this.uri, name))
            .map((uri) => ({ id: getMacroId(uri), uri })),
        (_error) => [],
      );
      this.initialized = true;
      this.addItems(...entries);
    }
    const files = await super.getFiles();
    return files;
  }

  public override owns(locator: UriLocator): boolean {
    const uri = locator instanceof vscode.Uri ? locator : locator.uri;
    return isParent(this.uri, uri, { mustBeImmediate: true });
  }
}
