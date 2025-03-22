import * as vscode from 'vscode';
import { Macro } from './macro';


export type RunId = string;

export interface RunInfo {
  cts: vscode.CancellationTokenSource;
  macro: Macro;
  runId: RunId;
};
