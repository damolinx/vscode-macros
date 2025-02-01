export class Lazy<T, TArgs extends unknown[] = []> {
  private readonly factory: (...args: TArgs) => T;
  private initialized: boolean;
  private value?: T;

  constructor(factory: (...args: TArgs) => T) {
    this.factory = factory;
    this.initialized = false;
  }

  public get(...args: TArgs): T {
    if (!this.initialized) {
      this.value = this.factory(...args);
      this.initialized = true;
    }

    return this.value!;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public reset(): void {
    if (this.initialized) {
      this.initialized = false;
      this.value = undefined;
    }
  }
}
