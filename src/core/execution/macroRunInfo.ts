import * as vscode from 'vscode';
import { Macro } from '../macro';

export type MacroRunId = string;

export interface MacroRunInfo {
  cts: vscode.CancellationTokenSource;
  id: MacroRunId;
  macro: Macro;
  startup?: true;
};

export interface MacroRunStopInfo extends MacroRunInfo {
  error?: Error | string;
  id: MacroRunId;
  macro: Macro;
};