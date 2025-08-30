export type MacroRunId = string & { __macroRunIdBrand: void };

export function getMacroRunId(name: string, index: number, startup?: true): MacroRunId {
  return `${name}@${startup ? 'startup' : index.toString().padStart(3, '0')}` as MacroRunId;
}
