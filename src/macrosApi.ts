import * as vscode from 'vscode';
import * as vm from 'vm';
import { RunId } from './runInfo';

export interface DisposableLikes {
  /**
   * Function to clean up resources.
   */
  dispose: () => any;
}

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
  readonly __disposables: DisposableLikes[];
  /**
   * Id of current macro execution.
   */
  readonly __runId: RunId;

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

/**
 * Minimum context provided to a macro.
 */
export interface MacroContext extends vm.Context, MacrosApi {
  readonly atob: typeof atob;
  readonly btoa: typeof btoa;
  readonly clearInterval: typeof clearInterval;
  readonly clearTimeout: typeof clearTimeout;
  readonly crypto: typeof crypto;
  readonly fetch: typeof fetch;
  readonly global: typeof global;
  readonly require: typeof require;
  readonly setInterval: typeof setInterval;
  readonly setTimeout: typeof setTimeout;
  readonly vscode: typeof vscode;
}

export interface MacroInitParams {
  disposables: DisposableLikes[];
  runId: string;
  token: vscode.CancellationToken;
  uri?: vscode.Uri;
}

export function initalizeContext(context: vm.Context, params: MacroInitParams): MacroContext {
  const updatedContext = Object.assign(context,
    {
      atob: atob,
      btoa: btoa,
      clearInterval: clearInterval,
      clearTimeout: clearTimeout,
      crypto: crypto,
      fetch: fetch,
      global: global,
      require: require,
      setInterval: setInterval,
      setTimeout: setTimeout,
      vscode: vscode,
    },
    createMacroApi(params));
  return updatedContext;
}

export function initializeMacrosApi(context: MacroContext, params: MacroInitParams): MacroContext {
  const updatedContext = Object.assign(context, createMacroApi(params));
  return updatedContext;
}

function createMacroApi(params: MacroInitParams): MacrosApi {
  return {
    __cancellationToken: params.token,
    __disposables: params.disposables,
    __runId: params.runId,
    macros: {
      macro: {
        uri: params.uri,
      }
    }
  };
}
