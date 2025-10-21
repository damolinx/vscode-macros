import * as vscode from 'vscode';
import * as os from 'os';
import { join, posix, relative } from 'path';
import { Lazy } from '../../utils/lazy';
import { areUriEqual, isParent, resolveAsUri } from '../../utils/uri';
import { ConfigurationSource, Source } from './source';

export const USER_HOME_TOKEN = '${userHome}';
export const WORKSPACE_TOKEN = '${workspaceFolder}';

export abstract class SourceManager implements vscode.Disposable {
  protected readonly _sources: Lazy<readonly Source[]>;
  protected readonly configKey: string;
  protected readonly disposables: vscode.Disposable[];

  constructor(configKey: string) {
    this._sources = new Lazy(() => this.loadSources());
    this.configKey = configKey;
    this.disposables = [];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public async addLibrary(
    uri: vscode.Uri,
  ): Promise<{ added: boolean; target: vscode.ConfigurationTarget; value: string }> {
    const source = SourceManager.normalizePath(uri.scheme === 'file' ? uri.fsPath : uri.toString());
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
          tokenizedSource: SourceManager.normalizePath(
            join(WORKSPACE_TOKEN, relative(workspaceFolder.uri.fsPath, uri.fsPath)),
          ),
          configurationTarget: vscode.ConfigurationTarget.Workspace,
        };
      }
      const userHome = vscode.Uri.file(os.homedir());
      if (uri.scheme === 'file' && (userHome.fsPath === uri.fsPath || isParent(userHome, uri))) {
        return {
          tokenizedSource: SourceManager.normalizePath(
            join(USER_HOME_TOKEN, relative(os.homedir(), uri.fsPath)),
          ),
          configurationTarget: vscode.ConfigurationTarget.Global,
        };
      }
      return {};
    }
  }

  public getLibrary(uri: vscode.Uri): Source | undefined {
    return this.sources.find((s) => areUriEqual(s.uri, uri));
  }

  public hasLibrary(uri: vscode.Uri): boolean {
    return Boolean(this.getLibrary(uri));
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
    const uniqueExistingValues = new Set<string>(
      preferredInspected?.map(SourceManager.normalizePath),
    );
    return uniqueExistingValues;
  }

  private loadSources(): Source[] {
    const inspected = vscode.workspace.getConfiguration().inspect<string[]>(this.configKey);
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

      for (const normalized of values.map(SourceManager.normalizePath)) {
        const scopes = rawValueToScopes.get(normalized);
        if (scopes) {
          scopes.add(scope);
        } else {
          rawValueToScopes.set(normalized, new Set([scope]));
        }
      }
    }

    // De-duplicate evaluated values
    const expandedToSource = new Map<string, Source>();
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
      return [...paths].map(SourceManager.normalizePath);
    }
  }

  public async removeLibrary(
    uri: vscode.Uri,
    target?: vscode.ConfigurationTarget,
  ): Promise<boolean> {
    const match = this.getLibrary(uri);
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

  public get sources(): readonly Source[] {
    return this._sources.get();
  }

  protected static normalizePath(path: string): string {
    const normalized = posix.normalize(path.replaceAll('\\', '/'));
    return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  }
}
