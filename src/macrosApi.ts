import * as vscode from 'vscode';

export interface MacrosApi {
  /**
   * Current macro
   */
  macro: {
    /**
     * URI of current macro. It can be undefined if running from an in-memory buffer.
     */
    readonly uri: vscode.Uri | undefined;
  }
}