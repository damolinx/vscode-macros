import * as _vscode from 'vscode';

declare global {

  /**
   * Visual Studio Code Extension API.
   * See https://code.visualstudio.com/api for more information.
   */
  declare const vscode: typeof _vscode;

  /**
   * A [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken)
   * used by the extension to notify about a stop request. 
   */
  declare const __cancellationToken: _vscode.CancellationToken;

  /**
   * Id of the current macro execution session.
   */
  declare const __runId: string;

  /**
   * Macros Extension for Visual Studio Code API.
   * See https://github.com/damolinx/vscode-macros#readme for more information.
   */
  declare const macros: {
    /**
     * Current macro.
     */
    readonly macro: {
      /**
       * URI of current macro. It can be undefined if running from an in-memory buffer.
       */
      readonly uri: _vscode.Uri | undefined;
    }
  };
};
