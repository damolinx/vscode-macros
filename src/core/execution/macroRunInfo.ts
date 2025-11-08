import * as vscode from 'vscode';
import { Macro } from '../macro';
import { MacroOptions } from '../macroOptions';
import { MacroRunId } from './macroRunId';

export interface MacroRunSnapshot {
  code: string;
  options: MacroOptions;
  startedOn: number;
  version: number;
}

export interface MacroRunInfo {
  cts: vscode.CancellationTokenSource;
  macro: Macro;
  runId: MacroRunId;
  runnableCode: string;
  snapshot: MacroRunSnapshot;
  startup?: true;
}

export interface MacroRunResult {
  error?: Error | string;
  result?: any;
  runInfo: MacroRunInfo;
}
