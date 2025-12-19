import * as vscode from 'vscode';

export interface ConfigurationSource {
  target: vscode.ConfigurationTarget;
  value: string;
}

export interface Source {
  readonly configSources: [ConfigurationSource, ...ConfigurationSource[]];
  readonly expandedValue: string;
  readonly uri: vscode.Uri;
}
