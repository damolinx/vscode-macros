import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';

export abstract class TreeDataProvider<T> implements vscode.TreeDataProvider<T>, vscode.Disposable {
  protected readonly context: ExtensionContext;
  protected readonly disposables: vscode.Disposable[];
  protected readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<T[] | T | void>;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();

    this.disposables = [this.onDidChangeTreeDataEmitter];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  public get onDidChangeTreeData(): vscode.Event<T[] | T | void> {
    return this.onDidChangeTreeDataEmitter.event;
  }

  public abstract getChildren(element?: T): Promise<T[] | undefined> | T[] | undefined;

  public abstract getParent(_element?: T): Promise<T | undefined> | T | undefined;

  public abstract getTreeItem(element: T): Promise<vscode.TreeItem> | vscode.TreeItem;

  public refresh(element?: T[] | T): void {
    return this.onDidChangeTreeDataEmitter.fire(element);
  }
}
