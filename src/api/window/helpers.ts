import { ExtensionContext } from '../../extensionContext';

export interface LogMessage {
  message: string;
  level: 'debug' | 'error' | 'info' | 'trace' | 'warn';
  data?: any;
}

export function handleLogMessage({ log }: ExtensionContext, message: LogMessage): void {
  const logFn = log[message.level];

  if (typeof logFn !== 'function') {
    log.error('Unknown log level', message.level, message);
    return;
  }

  logFn(message.message, message.data);
}
