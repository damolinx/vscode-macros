import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';

export class TreeViewState<TId extends string = string> {
  private readonly key: string;
  private readonly memento: vscode.Memento;
  private readonly expanded: Set<TId>;

  constructor({ extensionContext: { globalState } }: ExtensionContext, key: TId) {
    this.key = key;
    this.memento = globalState;
    const saved = globalState.get<TId[]>(key) ?? [];
    this.expanded = new Set(saved);
  }

  public isExpanded(id: TId): boolean {
    return this.expanded.has(id);
  }

  public onExpand(id: TId): void {
    if (!this.expanded.has(id)) {
      this.expanded.add(id);
      this.save();
    }
  }

  public onCollapse(id: TId): void {
    if (this.expanded.delete(id)) {
      this.save();
    }
  }

  public prune(currentIds: TId[]): void {
    let changed = false;
    for (const id of this.expanded) {
      if (!currentIds.includes(id)) {
        changed ||= this.expanded.delete(id);
      }
    }

    if (changed) {
      this.save();
    }
  }

  private save(): void {
    this.memento.update(this.key, Array.from(this.expanded));
  }
}
