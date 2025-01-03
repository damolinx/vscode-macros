import * as vscode from 'vscode';
import { Lazy } from './lazy';

export type MacroId = string;

export class Macro {
  public readonly id: MacroId;
  private readonly persistentLazy: Lazy<Promise<boolean>>;
  private readonly singletonLazy: Lazy<Promise<boolean>>;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    this.id = Macro.getId(uri);
    this.uri = uri;

    this.persistentLazy = new Lazy(async () => {
      const code = await this.getCode();
      return /\/\/\s*@macro:persist\s*$/m.test(code);
    });

    this.singletonLazy = new Lazy(async () => {
      const code = await this.getCode();
      return /\/\/\s*@macro:singleton\s*$/m.test(code);
    });
  }

  public async getCode() {
    const document = await vscode.workspace.openTextDocument(this.uri);
    return document.getText();
  }

  public static getId(uri: vscode.Uri): MacroId {
    return uri.toString(true);
  }

  public get singleton(): Promise<boolean> {
    return this.singletonLazy.get();
  }

  public get persistent(): Promise<boolean> {
    return this.persistentLazy.get();
  }
}
