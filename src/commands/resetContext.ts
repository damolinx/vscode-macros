import * as vscode from 'vscode';
import { Manager } from '../manager';
import { UriHelpers } from '../common/vscodeEx';

export function resetSharedContext(manager: Manager, pathOrUri: string | vscode.Uri): void {
  const uri = UriHelpers.toUri(pathOrUri);
  const runner = manager.getRunner(uri);
  runner.resetSharedContext();
}