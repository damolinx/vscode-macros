import * as vscode from 'vscode';

export interface MacrosApi {
  /**
   * URI of current macro. It can be undefined if running from an in-memory buffer.
   */
  readonly macroFile: vscode.Uri | undefined;
}