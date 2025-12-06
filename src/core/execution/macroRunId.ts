import { Id } from '../id';

export type MacroRunId = Id<'MacroRun'>;

export function getMacroRunId(name: string, index: number | string, startup?: true): MacroRunId {
  const token = startup
    ? index !== 1
      ? `startup(${index})`
      : 'startup'
    : typeof index === 'string'
      ? index
      : index.toString().padStart(3, '0');

  return `${name}@${token}` as MacroRunId;
}

export function getMacroRunIdName(id: MacroRunId): string {
  return id.substring(0, id.lastIndexOf('@'));
}

export function getMacroRunIdToken(id: MacroRunId): string {
  return id.substring(id.lastIndexOf('@'));
}
