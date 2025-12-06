import * as vscode from 'vscode';
import { getId, Id } from '../id';

export type LibraryId = Id<'Library'>;

export function getLibraryId(uri: vscode.Uri): LibraryId {
  return getId<'Library'>(uri);
}
