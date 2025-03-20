import * as vscode from 'vscode';
import * as vm from 'vm';

export interface MacroApi {
  /**
   * URI of current macro. It can be undefined if running from an in-memory buffer.
   */
  readonly uri: vscode.Uri | undefined;
}

export interface MacrosApi {
  /**
   * Current macro.
   */
  macro: MacroApi
}

export function initalizeContext(context: vm.Context) {
  context.atob = atob;
  context.btoa = btoa;
  context.clearInterval = clearInterval;
  context.clearTimeout = clearTimeout;
  context.crypto = crypto;
  context.fetch = fetch;
  context.global = global;
  context.require = require;
  context.setInterval = setInterval;
  context.setTimeout = setTimeout;
  context.vscode = vscode;
  return context;
}

export function initializeMacrosApi(context: vm.Context, uri: vscode.Uri, runId: string, token: vscode.CancellationToken) {
  context.__cancellationToken = token;
  context.__runId = runId;
  context.macros = {
    macro: {
      uri,
    }
  } as MacrosApi;

  return context;
}
