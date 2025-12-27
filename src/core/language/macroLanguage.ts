import * as vscode from 'vscode';
import { PathLike } from '../../utils/uri';

export type MacroLanguageId = 'javascript' | 'typescript';

type MacroLanguageParams = {
  [K in keyof MacroLanguage as MacroLanguage[K] extends (...args: any[]) => any
    ? never
    : K]: MacroLanguage[K];
};

export class MacroLanguage {
  public readonly defaultExtension: string;
  public readonly exclusionExtensions: readonly string[];
  public readonly extensions: readonly string[];
  public readonly id: MacroLanguageId;
  public readonly name: string;

  constructor(params: MacroLanguageParams) {
    this.defaultExtension = params.defaultExtension;
    this.exclusionExtensions = params.exclusionExtensions;
    this.extensions = params.extensions;
    this.id = params.id;
    this.name = params.name;
  }

  public accepts(pathOrUri: PathLike): boolean {
    return Boolean(this.matchExtension(pathOrUri));
  }

  public matchExtension(pathOrUri: PathLike): string | undefined {
    const path = pathOrUri instanceof vscode.Uri ? pathOrUri.path : pathOrUri;
    if (this.exclusionExtensions.some((ext) => path.endsWith(ext))) {
      return undefined;
    }
    return this.extensions.find((ext) => path.endsWith(ext));
  }
}
