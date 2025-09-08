import * as vscode from 'vscode';

export type ConfigurationScope = 'user' | 'workspace';

export interface ConfigurationSource {
  scope: ConfigurationScope;
  value: string;
}

export interface MacroLibrarySource {
  readonly sources: [ConfigurationSource, ...ConfigurationSource[]];
  readonly expandedValue: string;
  readonly uri: vscode.Uri;
}
