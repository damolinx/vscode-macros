import * as vscode from 'vscode';

export interface LogMessage {
  message: string;
  level: 'debug' | 'error' | 'info' | 'trace' | 'warn';
  data?: any;
}

export function handleLogMessage(log: vscode.LogOutputChannel, message: LogMessage): void {
  const logFn = log[message.level];
  if (typeof logFn !== 'function') {
    log.error('Unknown log level', message.level, message);
    return;
  }

  if (message.data !== null && message.data !== undefined) {
    logFn(message.message, message.data);
  } else {
    logFn(message.message);
  }
}
