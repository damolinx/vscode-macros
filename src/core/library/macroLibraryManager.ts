import * as vscode from 'vscode';
import * as os from 'os';
import { MacroLibrary } from './macroLibrary';
import { Lazy } from '../../utils/lazy';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';
export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export class MacroLibraryManager implements vscode.Disposable {
  public readonly libraries: Lazy<readonly MacroLibrary[]>;
  private readonly onDidChangeConfigDisposable: vscode.Disposable;

  constructor() {
    this.libraries = new Lazy(() => MacroLibraryManager.getLibraries());
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

  private static getLibraries(): MacroLibrary[] {
    const uniqueRoots = new Set<string>();

    getConfigValue().forEach((path) => expandSourceDirPath(
      path, ...vscode.workspace.workspaceFolders ?? []));

    return [...uniqueRoots].map((root) => new MacroLibrary(vscode.Uri.file(root)));

    function getConfigValue(folder?: vscode.WorkspaceFolder) {
      return vscode.workspace.getConfiguration(undefined, folder)
        .get<string[]>(SOURCE_DIRS_CONFIG, []);
    }

    function expandSourceDirPath(path: string, ...workspaceFolders: vscode.WorkspaceFolder[]) {
      if (path.includes(USER_HOME_TOKEN)) {
        uniqueRoots.add(path.replace(USER_HOME_TOKEN, os.homedir()));
      } else if (path.includes(WORKSPACE_TOKEN)) {
        workspaceFolders.forEach((folder) => {
          uniqueRoots.add(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath));
        });
      }
    }
  }
}