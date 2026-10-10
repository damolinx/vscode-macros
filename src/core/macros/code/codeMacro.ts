import * as vscode from 'vscode';
import { Macro } from '../../macroBase';
import { getMacroId, CodeMacroId } from './codeMacroId';
import { CodeSnapshot } from './codeSnapshot';

export class CodeMacro extends Macro<CodeMacroId> {
  private _snapshot?: CodeSnapshot;

  constructor(uri: vscode.Uri, id = getMacroId(uri)) {
    super(id, uri);
  }

  public async getSnapshot(): Promise<CodeSnapshot> {
    const document = await vscode.workspace.openTextDocument(this.uri);
    if (this._snapshot?.version !== document.version) {
      this._snapshot = new CodeSnapshot(document, this.id);
    }
    return this._snapshot;
  }
}
