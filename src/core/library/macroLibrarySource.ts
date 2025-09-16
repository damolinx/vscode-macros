import * as vscode from 'vscode';

export interface ConfigurationSource {
  target: vscode.ConfigurationTarget;
  value: string;
}

export interface MacroLibrarySource {
  readonly sources: [ConfigurationSource, ...ConfigurationSource[]];
  readonly expandedValue: string;
  readonly uri: vscode.Uri;
}
