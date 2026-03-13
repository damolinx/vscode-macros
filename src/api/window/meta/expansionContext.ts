export class ExpansionContext {
  private readonly counters: Map<string, number>;
  constructor() {
    this.counters = new Map();
  }

  public nextId(key = 'default'): number {
    const current = this.counters.get(key) ?? 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }
}
