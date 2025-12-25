import * as vscode from 'vscode';
import { SOURCE_DIRS_CONFIG } from '../core/library/macroLibrarySourceManager';
import { STARTUP_MACROS_CONFIG } from '../core/library/startupMacroLibrarySourceManager';

export function openSourceDirectoriestSettings(
  target?: vscode.ConfigurationTarget,
): Thenable<void> {
  return openSettings(SOURCE_DIRS_CONFIG, target);
}

export function openStartupMacrosSettings(target?: vscode.ConfigurationTarget): Thenable<void> {
  return openSettings(STARTUP_MACROS_CONFIG, target);
}

function openSettings(setting: string, target?: vscode.ConfigurationTarget): Thenable<void> {
  switch (target ?? vscode.ConfigurationTarget.Global) {
    case vscode.ConfigurationTarget.Global:
      return vscode.commands.executeCommand('workbench.action.openSettings', setting);
    case vscode.ConfigurationTarget.Workspace:
      return vscode.commands.executeCommand('workbench.action.openWorkspaceSettings', setting);
    case vscode.ConfigurationTarget.WorkspaceFolder:
      return vscode.commands.executeCommand('workbench.action.openFolderSettings', setting);
  }
}
