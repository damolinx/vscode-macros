import { MacroRunId } from './macroRunId';

export class ViewManager {
  private readonly idAssignments = new Map<string, MacroRunId | undefined>();

  constructor(prefix: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.idAssignments.set(`${prefix}${i + 1}`, undefined);
    }
  }

  /**
   * Assigns the first available ID to the requestor.
   * @returns Assigned ID, or `undefined` if none are available.
   */
  public getId(requestor: MacroRunId): string | undefined {
    for (const [id, owner] of this.idAssignments) {
      if (owner === undefined) {
        this.idAssignments.set(id, requestor);
        return id;
      }
    }
    return undefined;
  }

  /**
   * Releases all IDs owned by the requestor.
   */
  public releaseOwnedIds(requestor: MacroRunId): void {
    for (const [id, owner] of this.idAssignments) {
      if (owner === requestor) {
        this.idAssignments.set(id, undefined);
      }
    }
  }

  /**
   * Releases the ID if it was assigned to the requestor.
   * @returns `true` if released, `false` otherwise.
   */
  public releaseId(requestor: MacroRunId, id: string): boolean {
    if (this.idAssignments.get(id) === requestor) {
      this.idAssignments.set(id, undefined);
      return true;
    }
    return false;
  }
}
