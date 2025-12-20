import * as vscode from 'vscode';
import { SandboxExecutor } from '../../core/execution/executors/sandboxExecutor';
import { tryResolveMacroLanguage } from '../../core/language';
import { StartupMacroLibrarySourceManager } from '../../core/library/startupMacroLibrarySourceManager';
import { Macro } from '../../core/macro';
import { IconColor, JsIconColor, TsIconColor } from '../../ui/icons';
import { formatDisplayUri } from '../../utils/ui';
import { isUntitled, parentUri } from '../../utils/uri';

const Icon = new vscode.ThemeIcon('symbol-function', IconColor);
const JsIcon = new vscode.ThemeIcon('symbol-function', JsIconColor);
const TsIcon = new vscode.ThemeIcon('symbol-function', TsIconColor);

export async function createMacroItem(
  macro: Macro,
  executor?: SandboxExecutor,
): Promise<vscode.TreeItem> {
  const item = new vscode.TreeItem(macro.uri, vscode.TreeItemCollapsibleState.None);
  item.contextValue = 'macroFile';
  item.command = { arguments: [macro.uri], command: 'vscode.open', title: 'Open' };
  item.iconPath = getIcon(tryResolveMacroLanguage(macro.uri)?.language.languageId);
  item.label = macro.name;
  item.tooltip = new vscode.MarkdownString(formatDisplayUri(macro.uri));

  await updateMacroType(item as vscode.TreeItem & { tooltip: vscode.MarkdownString }, macro);
  if (executor) {
    updateRunningMacro(item as vscode.TreeItem & { tooltip: vscode.MarkdownString }, executor);
  }

  return item;
}

function getIcon(languageId?: string): vscode.ThemeIcon {
  switch (languageId) {
    case 'javascript':
      return JsIcon;
    case 'typescript':
      return TsIcon;
    default:
      return Icon;
  }
}

function updateRunningMacro(
  item: vscode.TreeItem & { tooltip: vscode.MarkdownString },
  { executionCount, executions }: SandboxExecutor,
): void {
  if (executionCount === 0) {
    return;
  }

  item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  item.contextValue += ' running';
  item.description = `(${executionCount})`;

  let tooltip = `  \n**Instances**: ${executionCount}`;
  if (executionCount > 1) {
    const multipleRevisions = executions
      .slice(1)
      .some(({ snapshot }) => snapshot.version !== executions[0].snapshot.version);
    if (multipleRevisions) {
      tooltip += ' (multiple revisions)';
    }
  }
  item.tooltip.appendMarkdown(tooltip);
}

async function updateMacroType(
  item: vscode.TreeItem & { tooltip: vscode.MarkdownString },
  macro: Macro,
): Promise<void> {
  if (isUntitled(macro.uri)) {
    item.contextValue += ' untitled';

    if (!item.description) {
      const parent = parentUri(macro.uri);
      if (parent.path !== '.') {
        item.description = formatDisplayUri(parent);
      }
    }

    item.iconPath = getIcon((await macro.getCode()).languageId);
  } else if (StartupMacroLibrarySourceManager.instance.inLibrary(macro.uri)) {
    item.contextValue += ' startup';
    item.tooltip.appendMarkdown('  \nStartup macro');
  }
}
