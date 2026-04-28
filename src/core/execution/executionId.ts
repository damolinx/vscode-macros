import { Id } from '../id';

export type ExecutionId = Id<'ExecutionId'>;

export function getExecutionId(name: string, index: number | string, startup?: true): ExecutionId {
  const token = startup
    ? index !== 1
      ? `startup(${index})`
      : 'startup'
    : typeof index === 'string'
      ? index
      : index.toString().padStart(3, '0');

  return `${name}@${token}` as ExecutionId;
}

export function getExecutionIdName(id: ExecutionId): string {
  return id.substring(0, id.lastIndexOf('@'));
}

export function getExecutionIdToken(id: ExecutionId): string {
  return id.substring(id.lastIndexOf('@'));
}
