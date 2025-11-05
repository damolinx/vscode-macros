import * as _vscode from 'vscode';

declare global {

  /**
   * Visual Studio Code Extension API.
   * See https://code.visualstudio.com/api for more information.
   */
  const vscode: typeof _vscode;

  /**
   * A [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken)
   * used by the extension to notify about a stop request.
   */
  const __cancellationToken: _vscode.CancellationToken;

  /**
   * Array of [disposables](https://code.visualstudio.com/api/references/vscode-api#Disposable) to release when macro completes.
   */
  const __disposables: ({ dispose: () => any })[];

  /**
   * ID of macro run.
   */
  const __runId: string;

  /**
   * Macro run was triggered on startup.
   */
  const __startup: true | undefined;

  /**
   * Macros Extension for Visual Studio Code API.
   * See https://github.com/damolinx/vscode-macros#readme for more information.
   */
  const macros: {
    /**
     * **Macros** [log output channel](https://code.visualstudio.com/api/references/vscode-api#LogOutputChannel).
     */
    readonly log: vscode.LogOutputChannel;
    /**
     * Current macro.
     */
    readonly macro: {
      /**
       * URI of current macro. It can be undefined if running from an in-memory buffer.
       */
      readonly uri: _vscode.Uri | undefined;
    }

    /**
     * Namespace providing window / UI functionality.
     */
    readonly window: {
      /**
       * Assigns an available TreeView ID to the caller.
       */
      getTreeViewId(): string | undefined;

      /**
       * Assigns an available WebView ID to the caller.
       */
      getWebviewId(): string | undefined;

      /**
       * Releases a previously assigned TreeView ID.
       */
      releaseTreeViewId(id: string): boolean;

      /**
       * Releases a previously assigned WebView ID.
       */
      releaseWebviewId(id: string): boolean;
    }
  };
}

export { };
