import * as vscode from 'vscode';
import { Lazy } from './common/lazy';
import { MacroOptions, parseOptions } from './macroOptions';
import { basename } from 'path';

export type MacroId = string;

export class Macro {
  public readonly codeLazy: Lazy<Promise<string>>;
  public readonly id: MacroId;
  public readonly optionsLazy: Lazy<Promise<Readonly<MacroOptions>>>;
  public readonly uri: vscode.Uri;

  constructor(uri: vscode.Uri) {
    this.codeLazy = new Lazy(async () => (await vscode.workspace.fs.readFile(this.uri)).toString());
    this.id = Macro.getId(uri);
    this.optionsLazy = new Lazy(async () => parseOptions(await this.codeLazy.get()));
    this.uri = uri;
  }

  public static getId(uri: vscode.Uri): MacroId {
    return uri.toString(true);
  }

  public get code(): Promise<string> {
    return this.codeLazy.get();
  }

  public get options(): Promise<Readonly<MacroOptions>> {
    return this.optionsLazy.get();
  }

  public get shortName(): string {
    return basename(this.uri.fsPath);
  }
}
