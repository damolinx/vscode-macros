import * as vscode from 'vscode';
import { MacroRunInfo } from '../core/execution/macroRunInfo';
import { MacroRunner } from '../core/execution/macroRunner';
import { MacroLibrary, MacroLibraryId } from '../core/library/macroLibrary';
import { getMacroId, Macro, MacroId } from '../core/macro';
import { ExtensionContext } from '../extensionContext';
import { isUntitled, uriDirname } from '../utils/uri';
import { UntitledMacroLibrary } from './untitledMacroLibrary';

export type TreeElement = MacroLibrary | Macro | MacroRunInfo;
export type TreeEvent = TreeElement | TreeElement[] | undefined;

interface MonitoredLibraryData {
  disposable: vscode.Disposable;
  files: Set<MacroId>;
}

export class MacroExplorerTreeDataProvider
  implements vscode.TreeDataProvider<TreeElement>, vscode.Disposable
{
  private readonly context: ExtensionContext;
  private readonly disposables: vscode.Disposable[];
  private readonly monitoredLibraries: Map<MacroLibraryId, MonitoredLibraryData>;
  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<TreeEvent>;
  private readonly untitledLibrary: UntitledMacroLibrary;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.monitoredLibraries = new Map();
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    this.untitledLibrary = new UntitledMacroLibrary(this.context);
    this.ensureLibraryIsMonitored(this.untitledLibrary);

    this.disposables = [
      this.onDidChangeTreeDataEmitter,
      this.context.libraryManager.onDidChangeLibraries(() => {
        this.disposeMonitoredLibraries();
        this.onDidChangeTreeDataEmitter.fire(undefined);
      }),
      this.context.runnerManager.onRun(({ macro }) => this.fireOnDidChangeTreeData(macro)),
      this.context.runnerManager.onStop(({ runInfo }) =>
        this.fireOnDidChangeTreeData(runInfo.macro),
      ),
      this.untitledLibrary,
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
    this.disposeMonitoredLibraries();
  }

  private disposeMonitoredLibraries() {
    for (const { disposable } of this.monitoredLibraries.values()) {
      try {
        disposable.dispose();
      } catch (e: any) {
        this.context.log.error(e.message ?? e);
      }
    }
  }

  private ensureLibraryIsMonitored(library: MacroLibrary): MonitoredLibraryData {
    let entry = this.monitoredLibraries.get(library.id);
    if (!entry) {
      const createHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files) {
          const macroId = getMacroId(uri);
          if (!files.has(macroId)) {
            files.add(macroId);
            this.fireOnDidChangeTreeData(new Macro(uri), library);
          }
        }
      };

      const deleteHandler = (uri: vscode.Uri) => {
        const files = this.monitoredLibraries.get(library.id)?.files;
        if (files && files.has(getMacroId(uri))) {
          this.fireOnDidChangeTreeData(new Macro(uri), library);
        }
      };

      entry = {
        files: new Set(),
        disposable: vscode.Disposable.from(
          // VS Code does not report first-time saved files as
          // created but rather as changed, for reasons.
          library.onDidCreateMacro(createHandler),
          library.onDidChangeMacro(createHandler),
          library.onDidDeleteMacro(deleteHandler),
        ),
      };
      this.monitoredLibraries.set(library.id, entry);
    }
    return entry;
  }

  private fireOnDidChangeTreeData(macro: Macro, library?: MacroLibrary): void {
    // Refresh parent as Macro changes collapsible state, and
    // that won't be refreshed unless parent changes.
    const parent = library ?? this.getParent(macro);
    return this.onDidChangeTreeDataEmitter.fire(parent ? [parent, macro] : macro);
  }

  async getChildren(element?: TreeElement): Promise<TreeElement[]> {
    let children: TreeElement[];

    if (!element) {
      children = [...this.context.libraryManager.libraries.get()].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      children.push(this.untitledLibrary);
    } else if (element instanceof MacroLibrary) {
      const uris = await element.getFiles();
      children = uris.map((uri) => new Macro(uri)).sort((a, b) => a.name.localeCompare(b.name));
      const entry = this.ensureLibraryIsMonitored(element);
      entry.files = new Set(children.map((macro) => macro.id));
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      children = [...runner.runInstances].sort((a, b) => a.id.localeCompare(b.id));
    } else {
      children = [];
    }

    return children;
  }

  getParent(element: TreeElement): TreeElement | undefined {
    let parent: TreeElement | undefined;
    if (element instanceof MacroLibrary) {
      parent = undefined;
    } else if (element instanceof Macro) {
      parent = isUntitled(element)
        ? this.untitledLibrary
        : this.context.libraryManager.getLibrary(element.uri);
    } else {
      parent = element.macro;
    }
    return parent;
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    let treeItem: vscode.TreeItem;

    if (element instanceof MacroLibrary) {
      treeItem = getLibraryItem(element);
    } else if (element instanceof Macro) {
      const runner = this.context.runnerManager.getRunner(element);
      treeItem = getMacroItem(element, runner);
    } else {
      treeItem = getRunItem(element);
    }

    return treeItem;

    function getLibraryItem({ uri }: MacroLibrary) {
      const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = 'macroLibrary';
      if (!isUntitled(uri)) {
        item.description = vscode.workspace.asRelativePath(uri.with({ path: uriDirname(uri) }));
      } else {
        item.label = 'Temporary';
        item.contextValue += ',untitled';
        item.tooltip = 'In-memory macro documents.';
        item.iconPath = new vscode.ThemeIcon('server-process');
      }
      return item;
    }

    function getMacroItem({ uri }: Macro, runner: MacroRunner) {
      const { runInstanceCount: runCount } = runner;
      const item = new vscode.TreeItem(
        uri,
        runCount ? vscode.TreeItemCollapsibleState.Collapsed : undefined,
      );
      item.contextValue = 'macroFile';
      item.command = {
        arguments: [uri],
        command: 'vscode.open',
        title: 'Open Macro',
      };
      if (runCount) {
        item.contextValue += ',running';
        item.description = runCount === 1 ? '1 instance' : `${runCount} instances`;
        item.tooltip = `${uri.scheme === 'file' ? uri.fsPath : uri.toString(true)} · ${runCount === 1 ? '1 instance' : `${runCount} instances`}`;
      } else {
        item.iconPath = new vscode.ThemeIcon('symbol-function');
      }
      return item;
    }

    function getRunItem(runInfo: MacroRunInfo) {
      const item = new vscode.TreeItem(runInfo.id);
      item.contextValue = 'macroRun';
      item.tooltip = getTooltip();

      if (runInfo.startup) {
        item.description = 'startup';
        item.iconPath = new vscode.ThemeIcon('circle-filled');
      } else {
        item.iconPath = new vscode.ThemeIcon('circle-outline');
      }
      return item;

      function getTooltip(): string | vscode.MarkdownString | undefined {
        const options = Object.entries(runInfo.snapshot.options)
          .filter(([_, v]) => v)
          .map(([k]) => k);
        return `${runInfo.startup ? 'Startup run instance' : 'Run instance'}${options.length ? ` · ${options.join(' · ')}` : ''}`;
      }
    }
  }

  get onDidChangeTreeData(): vscode.Event<TreeEvent> {
    return this.onDidChangeTreeDataEmitter.event;
  }
}
