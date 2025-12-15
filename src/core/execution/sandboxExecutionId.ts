import { Id } from '../id';

export type SandboxExecutionId = Id<'SandboxExecution'>;

export function getSandboxExecutionId(
  name: string,
  index: number | string,
  startup?: true,
): SandboxExecutionId {
  const token = startup
    ? index !== 1
      ? `startup(${index})`
      : 'startup'
    : typeof index === 'string'
      ? index
      : index.toString().padStart(3, '0');

  return `${name}@${token}` as SandboxExecutionId;
}

export function getSandboxExecutionIdName(id: SandboxExecutionId): string {
  return id.substring(0, id.lastIndexOf('@'));
}

export function getSandboxExecutionIdToken(id: SandboxExecutionId): string {
  return id.substring(id.lastIndexOf('@'));
}
