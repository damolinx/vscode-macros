import { ExtensionContext } from '../../extensionContext';
import { Tree } from '../tree';
import { StartupTreeDataProvider, StartupTreeElement } from './startupTreeDataProvider';
import { StartupTreeDragAndDropController } from './startupTreeDragAndDropController';

const STARTUP_MACROS_VIEW_ID = 'macros.startupMacros';

export class StartupTree extends Tree<StartupTreeElement | undefined> {
  constructor(context: ExtensionContext) {
    const provider = new StartupTreeDataProvider(context);
    super(context, {
      dragAndDropController: new StartupTreeDragAndDropController(context),
      showCollapseAll: true,
      treeDataProvider: provider,
      viewId: STARTUP_MACROS_VIEW_ID,
    });
  }

  public override async focus(): Promise<void> {
    this.provider.refresh();
    return super.focus();
  }
}
