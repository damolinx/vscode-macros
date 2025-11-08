export type MacroRunIdString = string & { __macroRunIdBrand: void };

export class MacroRunId {
  public readonly id: MacroRunIdString;
  public readonly name: string;
  public readonly index: string;

  constructor(name: string, token: number | string, startup?: true) {
    this.index = typeof token === 'string' ? token : token.toString().padStart(3, '0');
    this.id = `${name}@${startup ? 'startup' : this.index}` as MacroRunIdString;
    this.name = name;
  }

  public toString(): string {
    return this.id;
  }
}
