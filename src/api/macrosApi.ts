import * as vscode from 'vscode';
import { MacroRunId } from '../core/execution/macroRunInfo';

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
  readonly __disposables: ({ dispose: () => any })[];
  /**
   * Id of current macro execution.
   */
  readonly __runId: MacroRunId;

  /**
   * Macros namespace
   */
  readonly macros: {
    /**
     * Current macro.
     */
    readonly macro: {
      /**
       * URI of current macro. It can be undefined if running from an in-memory buffer.
       */
      readonly uri?: vscode.Uri;
    }
  }
}
