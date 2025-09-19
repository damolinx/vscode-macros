import * as vscode from 'vscode';
import * as os from 'os';
import { posix, relative } from 'path';
import { join } from 'path/win32';
import { Lazy } from '../../utils/lazy';
import { isParent, resolveAsUri } from '../../utils/uri';
import { ConfigurationSource, MacroLibrarySource } from './macroLibrarySource';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export class MacroLibrarySourceManager implements vscode.Disposable {
  public static getSources(configKey: string): MacroLibrarySource[] {
    return MacroLibrarySourceManager.loadSources(configKey);
  }

  private readonly _sources: Lazy<readonly MacroLibrarySource[]>;
  private readonly configKey: string;
  private readonly disposables: vscode.Disposable[];
  private readonly onDidChangeSourcesEmitter: vscode.EventEmitter<void>;

  constructor(configKey: string) {
    this._sources = new Lazy(() => MacroLibrarySourceManager.loadSources(this.configKey));
    this.configKey = configKey;
    this.onDidChangeSourcesEmitter = new vscode.EventEmitter();

    this.disposables = [
      this.onDidChangeSourcesEmitter,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(this.configKey)) {
          this._sources.reset();
          this.onDidChangeSourcesEmitter.fire();
        }
      }),
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public async addLibrary(
    uri: vscode.Uri,
  ): Promise<{ added: boolean; target: vscode.ConfigurationTarget; value: string }> {
    const source = MacroLibrarySourceManager.normalizePath(
      uri.scheme === 'file' ? uri.fsPath : uri.toString(),
    );
    const { tokenizedSource, configurationTarget: detectedTarget } = getTokenizedSource(uri);
    const configurationTarget = detectedTarget ?? vscode.ConfigurationTarget.Global;

    const configuration = vscode.workspace.getConfiguration();
    const uniqueExistingValues = this.loadConfigurationValues(configurationTarget, configuration);

    let result: { added: boolean; target: vscode.ConfigurationTarget; value: string };
    if (tokenizedSource && uniqueExistingValues.has(tokenizedSource)) {
      result = { added: false, target: configurationTarget, value: tokenizedSource };
    } else if (uniqueExistingValues.has(source)) {
      result = { added: false, target: configurationTarget, value: source };
    } else {
      const targetSource = tokenizedSource || source;
      uniqueExistingValues.add(targetSource);
      await configuration.update(
        this.configKey,
        Array.from(uniqueExistingValues),
        configurationTarget,
      );
      result = { added: true, target: configurationTarget, value: targetSource };
    }

    return result;

    function getTokenizedSource(uri: vscode.Uri): {
      tokenizedSource?: string;
      configurationTarget?: vscode.ConfigurationTarget;
    } {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (workspaceFolder) {
        return {
          tokenizedSource: MacroLibrarySourceManager.normalizePath(
            join(WORKSPACE_TOKEN, relative(workspaceFolder.uri.fsPath, uri.fsPath)),
          ),
          configurationTarget: vscode.ConfigurationTarget.Workspace,
        };
      }
      const userHome = vscode.Uri.file(os.homedir());
      if (uri.scheme === 'file' && (userHome.fsPath === uri.fsPath || isParent(userHome, uri))) {
        return {
          tokenizedSource: MacroLibrarySourceManager.normalizePath(
            join(USER_HOME_TOKEN, relative(os.homedir(), uri.fsPath)),
          ),
          configurationTarget: vscode.ConfigurationTarget.Global,
        };
      }
      return {};
    }
  }

  private loadConfigurationValues(
    configurationTarget: vscode.ConfigurationTarget,
    configuration = vscode.workspace.getConfiguration(),
  ) {
    const allInspected = configuration.inspect<string[]>(this.configKey);
    const preferredInspected =
      allInspected?.[
        configurationTarget === vscode.ConfigurationTarget.Global ? 'globalValue' : 'workspaceValue'
      ];
    const verifiedInspected =
      preferredInspected && preferredInspected instanceof Array ? preferredInspected : [];
    const uniqueExistingValues = new Set<string>(
      verifiedInspected.map(MacroLibrarySourceManager.normalizePath),
    );
    return uniqueExistingValues;
  }

  public get onDidChangeSources(): vscode.Event<void> {
    return this.onDidChangeSourcesEmitter.event;
  }

  public async removeLibrary(
    uri: vscode.Uri,
    target?: vscode.ConfigurationTarget,
  ): Promise<boolean> {
    const match = this.sources.find((s) => s.uri.toString() === uri.toString());
    if (!match) {
      return false;
    }

    const configuration = vscode.workspace.getConfiguration();
    for (const source of match.sources.filter((t) => !target || t.target === target)) {
      const uniqueExistingValues = this.loadConfigurationValues(source.target, configuration);
      uniqueExistingValues.delete(source.value);
      await configuration.update(this.configKey, Array.from(uniqueExistingValues), source.target);
    }

    return true;
  }

  public get sources(): readonly MacroLibrarySource[] {
    return this._sources.get();
  }

  private static loadSources(configKey: string): MacroLibrarySource[] {
    const inspected = vscode.workspace.getConfiguration().inspect<string[]>(configKey);
    if (!inspected) {
      return [];
    }

    const scopeFields: [vscode.ConfigurationTarget, 'globalValue' | 'workspaceValue'][] = [
      [vscode.ConfigurationTarget.Global, 'globalValue'],
      [vscode.ConfigurationTarget.Workspace, 'workspaceValue'],
    ];

    const rawValueToScopes = new Map<string, Set<vscode.ConfigurationTarget>>();
    for (const [scope, field] of scopeFields) {
      const values = inspected[field];
      if (!values?.length) {
        continue;
      }

      for (const normalized of values.map(MacroLibrarySourceManager.normalizePath)) {
        const scopes = rawValueToScopes.get(normalized);
        if (scopes) {
          scopes.add(scope);
        } else {
          rawValueToScopes.set(normalized, new Set([scope]));
        }
      }
    }

    // De-duplicate evaluated values
    const expandedToSource = new Map<string, MacroLibrarySource>();
    for (const [rawValue, scopes] of rawValueToScopes) {
      const sources = [...scopes].map(
        (scope): ConfigurationSource => ({ target: scope, value: rawValue }),
      );
      for (const expandedValue of expand(rawValue)) {
        const entry = expandedToSource.get(expandedValue);
        if (entry) {
          entry.sources.push(...sources);
        } else {
          expandedToSource.set(expandedValue, {
            expandedValue,
            sources: sources as [ConfigurationSource, ...ConfigurationSource[]],
            uri: resolveAsUri(expandedValue),
          });
        }
      }
    }

    return Array.from(expandedToSource.values());

    function expand(path: string): string[] {
      const paths = new Set<string>();
      if (path.includes(USER_HOME_TOKEN)) {
        paths.add(path.replace(USER_HOME_TOKEN, os.homedir()));
      } else if (path.includes(WORKSPACE_TOKEN)) {
        vscode.workspace.workspaceFolders?.forEach((folder) => {
          paths.add(path.replace(WORKSPACE_TOKEN, folder.uri.fsPath));
        });
      } else {
        paths.add(path);
      }
      return [...paths].map(MacroLibrarySourceManager.normalizePath);
    }
  }

  private static normalizePath(path: string): string {
    const normalized = posix.normalize(path.replaceAll('\\', '/'));
    return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  }
}
