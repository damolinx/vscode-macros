import * as vscode from 'vscode';
import * as os from 'os';
import { posix } from 'path';
import { Lazy } from '../../utils/lazy';
import { resolveAsUri } from '../../utils/uri';
import { ConfigurationScope, ConfigurationSource, MacroLibrarySource } from './macroLibrarySource';

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

  public get onDidChangeSources(): vscode.Event<void> {
    return this.onDidChangeSourcesEmitter.event;
  }

  public get sources(): readonly MacroLibrarySource[] {
    return this._sources.get();
  }

  private static loadSources(configKey: string): MacroLibrarySource[] {
    const inspected = vscode.workspace.getConfiguration().inspect<string[]>(configKey);
    if (!inspected) {
      return [];
    }

    // De-duplicate unevaluated values
    const scopeFields: [ConfigurationScope, 'globalValue' | 'workspaceValue'][] = [
      ['user', 'globalValue'],
      ['workspace', 'workspaceValue'],
    ];

    const rawValueToScopes = new Map<string, Set<ConfigurationScope>>();
    for (const [scope, field] of scopeFields) {
      const values = inspected[field];
      if (!values?.length) {
        continue;
      }

      for (const normalized of values.map(normalizeValue)) {
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
      const sources = [...scopes].map((scope): ConfigurationSource => ({ scope, value: rawValue }));
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
      return [...paths].map(normalizeValue);
    }

    function normalizeValue(path: string): string {
      const normalized = posix.normalize(path.replaceAll('\\', '/'));
      return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
    }
  }
}
