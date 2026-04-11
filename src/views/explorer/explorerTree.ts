import * as vscode from 'vscode';
import { Library } from '../../core/library/library';
import { LibraryItemId } from '../../core/library/libraryItem';
import { Macro } from '../../core/macro';
import { isMacro } from '../../core/macroLanguages';
import { ExtensionContext } from '../../extensionContext';
import { Lazy } from '../../utils/lazy';
import { Tree } from '../tree';
import { TreeViewState } from '../treeViewState';
import { ExplorerTreeDataProvider, TreeElement } from './explorerTreeDataProvider';
import { ExplorerTreeDragAndDropController } from './explorerTreeDragAndDropController';

const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';
const MACRO_EXPLORER_EXPANDED_KEY = 'macros.macroExplorer.expanded';

export class ExplorerTree extends Tree<TreeElement> {
  public readonly expansionState: TreeViewState<LibraryItemId>;
  private readonly revealOptions: Lazy<{ select: true } | undefined>;

  constructor(context: ExtensionContext) {
    super(context, {
      dragAndDropController: new ExplorerTreeDragAndDropController(context),
      showCollapseAll: true,
      treeDataProvider: new ExplorerTreeDataProvider(context),
      viewId: MACRO_EXPLORER_VIEW_ID,
    });

    this.expansionState = new TreeViewState(context, MACRO_EXPLORER_EXPANDED_KEY);
    this.revealOptions = new Lazy(() => {
      const mode = vscode.workspace
        .getConfiguration('explorer')
        .get<boolean | string>('autoReveal');
      return mode === true ? { select: true } : undefined;
    });

    this.disposables.push(
      this.provider.onDidChangeTreeData(async (elementOrElements) => {
        const element =
          elementOrElements instanceof Array
            ? elementOrElements.findLast((elem) => elem instanceof Macro)
            : elementOrElements instanceof Macro
              ? elementOrElements
              : undefined;
        if (element) {
          await this.reveal(element);
        }
        this.expansionState.prune(context.libraryManager.libraries.map(({ id }) => id));
      }),
      this.view.onDidCollapseElement(({ element }) => {
        if (element instanceof Library) {
          this.expansionState.onCollapse(element.id);
        }
      }),
      this.view.onDidExpandElement(({ element }) => {
        if (element instanceof Library) {
          this.expansionState.onExpand(element.id);
        }
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('explorer.autoReveal')) {
          this.revealOptions.reset();
        }
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor || !this.view.visible) {
          return;
        }

        const { uri } = editor.document;
        const options = this.revealOptions.get();
        if (!isMacro(uri) || !options) {
          return;
        }

        if (this.context.libraryManager.libraryFor(uri)) {
          this.view.reveal(new Macro(uri), options);
        }
      }),
    );
  }
}
