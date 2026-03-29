import { Library } from '../../core/library/library';
import { LibraryItemId } from '../../core/library/libraryItem';
import { Macro } from '../../core/macro';
import { ExtensionContext } from '../../extensionContext';
import { Tree } from '../tree';
import { TreeViewState } from '../treeViewState';
import { ExplorerTreeDataProvider, TreeElement } from './explorerTreeDataProvider';
import { ExplorerTreeDragAndDropController } from './explorerTreeDragAndDropController';

const MACRO_EXPLORER_VIEW_ID = 'macros.macroExplorer';
const MACRO_EXPLORER_EXPANDED_KEY = 'macros.macroExplorer.expanded';

export class ExplorerTree extends Tree<TreeElement> {
  public readonly expansionState: TreeViewState<LibraryItemId>;

  constructor(context: ExtensionContext) {
    const provider = new ExplorerTreeDataProvider(context);
    super(context, {
      dragAndDropController: new ExplorerTreeDragAndDropController(context),
      showCollapseAll: true,
      treeDataProvider: provider,
      viewId: MACRO_EXPLORER_VIEW_ID,
    });
    this.expansionState = new TreeViewState(context, MACRO_EXPLORER_EXPANDED_KEY);

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
    );
  }
}
