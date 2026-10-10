import * as vscode from 'vscode';
import { CodeSnapshot } from './codeSnapshot';
import { MacroBase } from './macroBase';
import { getMacroId, MacroId } from './macroId';

export class Macro extends MacroBase<MacroId> {
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
