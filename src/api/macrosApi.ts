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
  readonly __disposables: vscode.Disposable[];
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
     * [Extension context](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext).
     */
    readonly extensionContext: vscode.ExtensionContext;

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
     * Namespace providing command APIs.
     */
    readonly commands: {
      /**
       * Executes one or more commands in sequence.
       * @param cmds Commands to execute. Each command may be specified as either:
       * - a string command ID
       * - a `[id, ...args]` tuple providing the command ID and its arguments.
       * @returns A promise resolving to an array of results, one per command.
       */
      executeCommands(...cmds: (string | [id: string, ...args: any[]])[]): Promise<any[]>;
    };

    /**
     * Namespace providing window and UI APIs.
     */
    readonly window: {
      /**
       * Returns an available TreeView ID for the caller.
       */
      getTreeViewId(): string | undefined;

      /**
       * Returns an available Webview ID for the caller.
       */
      getWebviewId(): string | undefined;

      /**
       * Releases a previously assigned TreeView ID.
       */
      releaseTreeViewId(id: string): boolean;

      /**
       * Releases a previously assigned Webview ID.
       */
      releaseWebviewId(id: string): boolean;
    };
  };
}
