import * as vscode from 'vscode';
import { Lazy } from '../../utils/lazy';
import { areUriEqual, resolveAsUri } from '../../utils/uri';
import { normalizePathSeparators, resolveTokenizedPath, tokenizeUri } from '../pathTokenization';
import { ConfigurationSource, Source } from './source';

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
    target?: vscode.ConfigurationTarget,
  ): Promise<{ added: boolean; target: vscode.ConfigurationTarget; value: string }> {
    const source = normalizePathSeparators(uri.scheme === 'file' ? uri.fsPath : uri.toString());
    const { tokenizedSource, configurationTarget: detectedTarget } = tokenizeUri(uri);
    const configurationTarget = target ?? detectedTarget ?? vscode.ConfigurationTarget.Global;

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
  }

  public getSource(uri: vscode.Uri): Source | undefined {
    return this.sources.find((s) => areUriEqual(s.uri, uri));
  }

  public hasSource(uri: vscode.Uri): boolean {
    return Boolean(this.getSource(uri));
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
    const uniqueExistingValues = new Set<string>(preferredInspected?.map(normalizePathSeparators));
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

      for (const normalized of values.map(normalizePathSeparators)) {
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
      for (const expandedValue of resolveTokenizedPath(rawValue)) {
        const entry = expandedToSource.get(expandedValue);
        if (entry) {
          entry.configSources.push(...sources);
        } else {
          expandedToSource.set(expandedValue, {
            expandedValue,
            configSources: sources as [ConfigurationSource, ...ConfigurationSource[]],
            uri: resolveAsUri(expandedValue),
          });
        }
      }
    }

    return Array.from(expandedToSource.values());
  }

  public async removeSourceFor(
    uri: vscode.Uri,
    target?: vscode.ConfigurationTarget,
  ): Promise<boolean> {
    const match = this.getSource(uri);
    if (!match) {
      return false;
    }

    const configuration = vscode.workspace.getConfiguration();
    for (const source of match.configSources.filter((t) => !target || t.target === target)) {
      const uniqueExistingValues = this.loadConfigurationValues(source.target, configuration);
      uniqueExistingValues.delete(source.value);
      await configuration.update(this.configKey, Array.from(uniqueExistingValues), source.target);
    }

    return true;
  }

  public get sources(): readonly Source[] {
    return this._sources.get();
  }
}
