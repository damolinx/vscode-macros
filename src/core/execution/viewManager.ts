import { MacroRunId } from './macroRunId';

export class ViewManager {
  private readonly idAssignments = new Map<string, MacroRunId | undefined>();

  constructor(prefix: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.idAssignments.set(`${prefix}${i + 1}`, undefined);
    }
  }

  /**
   * Assigns the first available ID to the requester.
   * @returns Assigned ID, or `undefined` if none are available.
   */
  public getId(requester: MacroRunId): string | undefined {
    for (const [viewId, ownerId] of this.idAssignments) {
      if (!ownerId) {
        this.idAssignments.set(viewId, requester);
        return viewId;
      }
    }
    return undefined;
  }

  /**
   * Releases all IDs owned by the requester.
   */
  public releaseOwnedIds(requester: MacroRunId): void {
    for (const [viewId, ownerId] of this.idAssignments) {
      if (ownerId === requester) {
        this.idAssignments.set(viewId, undefined);
      }
    }
  }

  /**
   * Releases the ID if it was assigned to the requester.
   * @returns `true` if released, `false` otherwise.
   */
  public releaseId(requester: MacroRunId, viewId: string): boolean {
    if (this.idAssignments.get(viewId) === requester) {
      this.idAssignments.set(viewId, undefined);
      return true;
    }
    return false;
  }
}
