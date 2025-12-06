import { Id } from '../id';

export type ViewId = Id<'View'>;

export function getViewId(name: string, index: number): ViewId {
  return `${name}${index}` as ViewId;
}
