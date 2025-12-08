import * as vscode from 'vscode';

export type LibraryItemId = string;

export interface LibraryItem<TLibraryItemId extends LibraryItemId = LibraryItemId> {
  id: TLibraryItemId;
  uri: vscode.Uri;
}
