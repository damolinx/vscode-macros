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
  const __disposables: _vscode.Disposable[];

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
     * [Extension context](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext).
     */
    readonly extensionContext: _vscode.ExtensionContext;
    /**
     * **Macros** [log output channel](https://code.visualstudio.com/api/references/vscode-api#LogOutputChannel).
     */
    readonly log: _vscode.LogOutputChannel;
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
    }
  };
}

export { };
