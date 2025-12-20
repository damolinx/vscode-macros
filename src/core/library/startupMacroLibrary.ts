import * as vscode from 'vscode';
import { isStartup, UriLocator } from '../../utils/uri';
import { getStartupMacroId, getStartupMacroUri, StartupMacroId } from '../startupMacroId';
import { Library } from './library';
import { LibraryItem } from './libraryItem';
import { StartupMacroLibrarySourceManager } from './startupMacroLibrarySourceManager';

export const STARTUP_MACRO_LIBRARY_NAME = 'Startup';

export class StartupMacroLibrary extends Library<StartupMacroId> {
  private static _instance: StartupMacroLibrary;

  public static instance(): StartupMacroLibrary {
    this._instance ??= new StartupMacroLibrary();
    return this._instance;
  }

  private initialized: boolean;

  private constructor() {
    super(vscode.Uri.from({ scheme: 'startup', path: STARTUP_MACRO_LIBRARY_NAME }));
    this.initialized = false;
    this.disposables.push(
      StartupMacroLibrarySourceManager.instance.onDidChangeSources(() => {
        const oldSet = new Set(this.items.keys());
        const newSet = new Map(
          StartupMacroLibrarySourceManager.instance.sources.map(({ uri }) => {
            const macroUri = getStartupMacroUri(uri);
            return [getStartupMacroId(macroUri), macroUri];
          }),
        );

        const added = [...newSet.keys()].filter((item) => !oldSet.has(item));
        const removed = [...oldSet].filter((item) => !newSet.has(item));
        if (added.length) {
          this.addItems(...added.map((id) => ({ id, uri: newSet.get(id)! })));
        }
        if (removed.length) {
          this.removeItems(...removed);
        }
      }),
    );
  }

  public override async getFiles(): Promise<LibraryItem<StartupMacroId>[]> {
    if (!this.initialized) {
      this.addItems(
        ...StartupMacroLibrarySourceManager.instance.sources.map((s) => {
          const macroUri = getStartupMacroUri(s.uri);
          return { id: getStartupMacroId(macroUri), uri: macroUri };
        }),
      );
      this.initialized = true;
    }

    const files = await super.getFiles();
    return files;
  }

  public owns(locator: UriLocator): boolean {
    return isStartup(locator);
  }

  public override get runnable(): boolean {
    return false;
  }
}
