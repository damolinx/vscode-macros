import * as vscode from 'vscode';
import { isStartup } from '../utils/uri';
import { getId, Id } from './id';

export type StartupMacroId = Id<'StartupMacro'>;

export function getStartupMacroId(uri: vscode.Uri): StartupMacroId {
  const startupUri = getStartupMacroUri(uri);
  return getId<'StartupMacro'>(startupUri);
}

export function getStartupMacroUri(uri: vscode.Uri): vscode.Uri {
  return isStartup(uri) ? uri : uri.with({ scheme: 'startup', fragment: uri.scheme });
}

export function getMacroUriFromStartupMacroId(id: StartupMacroId): vscode.Uri {
  const startupUri = vscode.Uri.parse(id);
  return getMacroUriFromStartupMacroUri(startupUri);
}

export function getMacroUriFromStartupMacroUri(uri: vscode.Uri): vscode.Uri {
  return isStartup(uri) ? uri.with({ scheme: uri.fragment, fragment: '' }) : uri;
}
