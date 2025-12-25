import * as vscode from 'vscode';
import { SandboxExecutionDescriptor } from '../../core/execution/sandboxExecutionDescriptor';
import { StartupMacro } from '../../core/startupMacro';
import { ExtensionContext } from '../../extensionContext';
import { NaturalComparer } from '../../utils/ui';
import { TreeDataProvider } from '../treeDataProvider';
import { SourceTarget } from './sourceTarget';
import { createStartupItem } from './startupMacroItem';

export type StartupTreeElement = StartupMacro | SourceTarget;

export class StartupTreeDataProvider extends TreeDataProvider<StartupTreeElement> {
  constructor(context: ExtensionContext) {
    super(context);

    const sandboxHandler = ({ startup }: SandboxExecutionDescriptor) =>
      startup && this.onDidChangeTreeDataEmitter.fire();
    this.disposables.push(
      this.context.sandboxManager.onExecutionStart(sandboxHandler),
      this.context.sandboxManager.onExecutionEnd(sandboxHandler),
      this.context.startupManager.onDidChangeSources(() => this.onDidChangeTreeDataEmitter.fire()),
    );
  }

  public override getChildren(element?: StartupTreeElement): StartupTreeElement[] | undefined {
    if (!element) {
      const roots: StartupTreeElement[] = [SourceTarget.Global];

      const { workspaceFolders } = vscode.workspace;
      if (workspaceFolders) {
        if (workspaceFolders.length === 1) {
          roots.push(SourceTarget.Workspace);
        } else {
          roots.push(...workspaceFolders.map(SourceTarget.WorkspaceFolder));
        }
      }

      return roots;
    }

    if (element instanceof SourceTarget) {
      return this.context.startupManager.sources
        .filter((src) => src.configSources.some(({ target }) => target === element.target))
        .map(({ uri }) => new StartupMacro(uri))
        .sort((a, b) => NaturalComparer.compare(a.name, b.name));
    }

    return undefined;
  }

  public override getTreeItem(element: StartupTreeElement): vscode.TreeItem {
    if (element instanceof SourceTarget) {
      return element.treeItem;
    }

    return createStartupItem(
      element,
      this.context.sandboxManager.getExecutor(element.macroUri)?.executions.find((i) => i.startup),
    );
  }
}
