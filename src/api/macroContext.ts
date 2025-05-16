import * as vscode from 'vscode';
import * as vm from 'vm';
import { MacrosApi } from './macrosApi';

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
