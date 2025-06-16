import * as vscode from 'vscode';
import * as os from 'os';
import { MacroLibrary } from './macroLibrary';
import { Lazy } from '../../utils/lazy';

export const SOURCE_DIRS_CONFIG = 'macros.sourceDirectories';
export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export class MacroLibraryManager implements vscode.Disposable {
  private readonly configKey: string;
  public readonly libraries: Lazy<readonly MacroLibrary[]>;
  private readonly onDidChangeConfigDisposable: vscode.Disposable;

  constructor() {
    this.configKey = SOURCE_DIRS_CONFIG;
    this.libraries = new Lazy(() => this.getLibraries());
    this.onDidChangeConfigDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(this.configKey)) {
        this.libraries.reset();
      }
    });
  }

  dispose() {
    this.onDidChangeConfigDisposable.dispose();
  }

  private getConfigValue(folder?: vscode.WorkspaceFolder) {
    return vscode.workspace.getConfiguration(undefined, folder)
      .get<string[]>(this.configKey, []);
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
    const uniqueRoots = new Set<string>();
    const { workspaceFolders } = vscode.workspace;

    for (const path of this.getConfigValue()) {
      const expandedPaths = [];
      if (path.includes(USER_HOME_TOKEN)) {
        expandedPaths.push(path.replace(USER_HOME_TOKEN, os.homedir()));
      } else if (path.includes(WORKSPACE_TOKEN)) {
        workspaceFolders?.forEach((folder) => {
          expandedPaths.push(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath));
        });
      } else {
        expandedPaths.push(path);
      }
      expandedPaths.forEach((p) => uniqueRoots.add(p.replace(/[/\\]+$/, '')));
    }

    return [...uniqueRoots].map((root) => new MacroLibrary(vscode.Uri.file(root)));
  }
}