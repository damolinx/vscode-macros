import * as vscode from 'vscode';
import { Macro } from '../macro';
import { MacroOptions } from '../macroOptions';

export type MacroRunId = string;

export interface MacroRunSnapshot {
  code: string;
  options: MacroOptions;
}

export interface MacroRunInfo {
  cts: vscode.CancellationTokenSource;
  id: MacroRunId;
  macro: Macro;
  snapshot: MacroRunSnapshot;
  startup?: true;
}

export interface MacroRunResult {
  error?: Error | string;
  result?: any;
  runInfo: MacroRunInfo;
}
