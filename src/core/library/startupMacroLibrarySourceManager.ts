import { SourceManager } from './sourceManager';

export class StartupMacroLibrarySourceManager extends SourceManager {
  private static _instance: StartupMacroLibrarySourceManager;

  public static get instance(): StartupMacroLibrarySourceManager {
    this._instance ??= new StartupMacroLibrarySourceManager();
    return this._instance;
  }

  private constructor() {
    super('macros.startupMacros');
  }
}
