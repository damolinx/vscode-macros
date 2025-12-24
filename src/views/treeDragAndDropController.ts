import * as vscode from 'vscode';
import { isMacro } from '../core/language';
import { ExtensionContext } from '../extensionContext';

export const FILELIST_MIMETYPE = 'text/uri-list';
export const FILELIST_SEP = '\r\n';
export const MACROLIST_MIMETYPE = 'application/vnd.code.tree.macros.macro-uri-list';

export abstract class TreeDragAndDropController<
  T extends { uri: vscode.Uri },
> implements vscode.TreeDragAndDropController<T> {
  protected readonly context: ExtensionContext;
  public readonly dragMimeTypes: readonly string[];
  public readonly dropMimeTypes: readonly string[];

  constructor(
    context: ExtensionContext,
    dragMimeTypes = [FILELIST_MIMETYPE, MACROLIST_MIMETYPE],
    dropMimeTypes = [FILELIST_MIMETYPE, MACROLIST_MIMETYPE],
  ) {
    this.context = context;
    this.dragMimeTypes = dragMimeTypes;
    this.dropMimeTypes = dropMimeTypes;
  }

  protected abstract get treeMimeType(): string;

  public handleDrag(
    source: T[],
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): void {
    if (source.length === 0) {
      return;
    }

    const uriList = source
      .filter((src): src is T & { uri: vscode.Uri } => !!src.uri)
      .map(({ uri }) => uri.toString())
      .join(FILELIST_SEP);

    const uriListItem = new vscode.DataTransferItem(uriList);

    if (this.dragMimeTypes.includes(FILELIST_MIMETYPE)) {
      dataTransfer.set(FILELIST_MIMETYPE, uriListItem);
    }
    if (this.dragMimeTypes.includes(MACROLIST_MIMETYPE)) {
      dataTransfer.set(MACROLIST_MIMETYPE, uriListItem);
    }

    dataTransfer.set(this.treeMimeType, new vscode.DataTransferItem(source));
  }

  public abstract handleDrop(
    target: T | undefined,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): Promise<void> | void;

  protected async getSourceUris(
    dataTransfer: vscode.DataTransfer,
  ): Promise<vscode.Uri[] | undefined> {
    const typedItems = dataTransfer.get(this.treeMimeType);
    if (typedItems) {
      return (typedItems.value as T[])
        .filter((item): item is T & { uri: vscode.Uri } => !!item.uri)
        .map(({ uri }) => uri);
    }

    const item =
      (this.dragMimeTypes.includes(FILELIST_MIMETYPE) && dataTransfer.get(FILELIST_MIMETYPE)) ||
      (this.dragMimeTypes.includes(MACROLIST_MIMETYPE) && dataTransfer.get(MACROLIST_MIMETYPE));
    if (!item) {
      return undefined;
    }

    const data = await item.asString();
    if (!data) {
      return undefined;
    }

    const uris = data
      .split(FILELIST_SEP)
      .filter(isMacro)
      .map((str) => vscode.Uri.parse(str, true));
    return uris;
  }
}
