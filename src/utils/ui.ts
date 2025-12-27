import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { join } from 'path';
import { AllLanguages } from '../core/macroLanguages';

export const NaturalComparer = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const MacroFilter: Record<string, string[]> = Object.fromEntries(
  AllLanguages.map(({ name, extensions }) => [name, extensions.map((ext) => ext.substring(1))]),
);

export function formatDisplayUri(uri: vscode.Uri) {
  if (uri.scheme === 'file' || (uri.scheme === 'untitled' && uri.fsPath)) {
    return normalizeFsPath(uri);
  } else if (uri.scheme === 'untitled') {
    return uri.path.replace(/^\//, '') || 'Untitled';
  } else {
    return uri.toString(true);
  }
}

export function formatHomeRelativePath(uri: vscode.Uri): string | undefined {
  if (uri.scheme === 'file' || (uri.scheme === 'untitled' && uri.fsPath)) {
    const homedir = os.homedir();
    const normalizedPath = normalizeFsPath(uri);
    if (normalizedPath === homedir || normalizedPath.startsWith(homedir + path.sep)) {
      return join(
        process.platform === 'win32' ? '‹home›' : '~/',
        normalizedPath.slice(homedir.length + 1),
        '..',
      );
    } else {
      return normalizedPath;
    }
  }

  return;
}

export function formatWorkspaceRelativePath(uri: vscode.Uri): string | undefined {
  const relativePath = vscode.workspace.asRelativePath(uri);
  if (uri.fsPath !== relativePath) {
    return join('‹workspace›', relativePath, '..');
  }

  return;
}

export function formatStartTimestampLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  if (isSameDay) {
    return time;
  }

  const day = date.toLocaleDateString([], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

  return `${day} at ${time}`;
}

function normalizeFsPath({ fsPath }: vscode.Uri) {
  return process.platform === 'win32' && fsPath.length > 1
    ? fsPath[0].toUpperCase() + fsPath.slice(1)
    : fsPath;
}
