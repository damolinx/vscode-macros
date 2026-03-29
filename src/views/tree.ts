import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { TreeDataProvider } from './treeDataProvider';

export abstract class Tree<TElement> implements vscode.Disposable {
  protected readonly disposables: vscode.Disposable[];
  protected readonly view: vscode.TreeView<TElement | undefined>;

  protected constructor(
    protected readonly context: ExtensionContext,
    private readonly options: vscode.TreeViewOptions<TElement> & {
      readonly viewId: string;
      readonly treeDataProvider: TreeDataProvider<TElement>;
    },
  ) {
    const { viewId, ...rest } = options;
    this.view = vscode.window.createTreeView(viewId, rest);
    this.disposables = [this.view, this.provider];
  }

  public dispose(): void {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public async focus(): Promise<void> {
    return vscode.commands.executeCommand(`${this.options.viewId}.focus`);
  }

  public get provider(): TreeDataProvider<TElement> {
    return this.options.treeDataProvider;
  }

  public refresh(element?: TElement[] | TElement): void {
    this.provider.refresh(element);
  }

  public async reveal(
    element: TElement,
    options?: {
      select?: true;
      focus?: true;
      expand?: true | number;
    },
  ): Promise<void> {
    await this.view.reveal(element, options);
  }

  public get selection(): readonly (TElement | undefined)[] {
    return this.view.selection;
  }
}
