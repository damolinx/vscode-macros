import * as vscode from 'vscode';

/**
 * Macro-API unique to a given macro run.
 */
export interface MacrosApi {
  /**
   * Cancellation token invoked when macro should stop.
   */
  readonly __cancellationToken: vscode.CancellationToken;
  /**
   * Array of disposables to release when macro completes.
   */
  readonly __disposables: { dispose: () => any }[];
  /**
   * ID of macro run.
   */
  readonly __runId: string;
  /**
   * Macro run was triggered on startup.
   */
  readonly __startup?: true;

  /**
   * Macros namespace
   */
  readonly macros: {

    /**
     * **Macros** log output channel.
     */
    readonly log: vscode.LogOutputChannel;

    /**
     * Current macro.
     */
    readonly macro: {
      /**
       * URI of current macro. It can be `undefined` if running from an in-memory buffer.
       */
      readonly uri?: vscode.Uri;
    };

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
