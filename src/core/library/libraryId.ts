import * as vscode from 'vscode';
import { createIdFromUri, Id } from '../id';

export type LibraryId = Id<'Library'>;

export function getLibraryId(uri: vscode.Uri): LibraryId {
  return createIdFromUri<LibraryId>(uri);
}
