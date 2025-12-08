import * as vscode from 'vscode';
import { uriBasename, UriLocator } from '../../utils/uri';
import { getLibraryId, LibraryId } from './libraryId';
import { LibraryItem, LibraryItemId } from './libraryItem';

export abstract class Library<
  TItemId extends LibraryItemId = LibraryItemId,
  TItem extends LibraryItem<TItemId> = LibraryItem<TItemId>,
> implements vscode.Disposable
{
  protected readonly disposables: vscode.Disposable[];
  public readonly id: LibraryId;
  protected readonly items: Map<TItemId, TItem>;
  public readonly name: string;
  private readonly onDidAddFilesEmitter: vscode.EventEmitter<TItem[]>;
  private readonly onDidChangeFilesEmitter: vscode.EventEmitter<TItem[]>;
  private readonly onDidRemoveFilesEmitter: vscode.EventEmitter<TItem[]>;
  public sorting: number;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri, id = getLibraryId(uri)) {
    this.id = id;
    this.items = new Map();
    this.name = uriBasename(uri);
    this.sorting = 100;
    this.uri = uri;
    this.disposables = [
      (this.onDidAddFilesEmitter = new vscode.EventEmitter()),
      (this.onDidChangeFilesEmitter = new vscode.EventEmitter()),
      (this.onDidRemoveFilesEmitter = new vscode.EventEmitter()),
    ];
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
  }

  protected addItems(...items: TItem[]): void {
    const added: TItem[] = [];
    items.forEach((item) => {
      if (!this.items.has(item.id)) {
        this.items.set(item.id, item);
        added.push(item);
      }
    });
    if (added.length) {
      this.onDidAddFilesEmitter.fire(added);
    }
  }

  public async getFiles(): Promise<TItem[]> {
    return [...this.items.values()];
  }

  public get onDidAddFiles(): vscode.Event<TItem[]> {
    return this.onDidAddFilesEmitter.event;
  }

  public get onDidChangeFiles(): vscode.Event<TItem[]> {
    return this.onDidChangeFilesEmitter.event;
  }

  public get onDidRemoveFiles(): vscode.Event<TItem[]> {
    return this.onDidRemoveFilesEmitter.event;
  }

  public abstract owns(locator: UriLocator): boolean;

  protected removeItems(...itemsOrIds: (TItem | TItemId)[]): void {
    const removed: TItem[] = [];
    itemsOrIds.forEach((itemOrId) => {
      const item = this.items.get(typeof itemOrId === 'string' ? itemOrId : itemOrId.id);
      if (item && this.items.delete(item.id)) {
        removed.push(item);
      }
    });
    if (removed.length) {
      this.onDidRemoveFilesEmitter.fire(removed);
    }
  }

  protected reportChangedItems(...itemsOrIds: (TItem | TItemId)[]): void {
    const changed: TItem[] = [];
    itemsOrIds.forEach((itemOrId) => {
      const item = this.items.get(typeof itemOrId === 'string' ? itemOrId : itemOrId.id);
      if (item) {
        changed.push(item);
      }
    });
    if (changed.length) {
      this.onDidChangeFilesEmitter.fire(changed);
    }
  }
}
