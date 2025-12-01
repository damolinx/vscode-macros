import * as vscode from 'vscode';

export type LibraryItemId = string;

export interface LibraryItem {
  id: LibraryItemId;
  uri: vscode.Uri;
}
