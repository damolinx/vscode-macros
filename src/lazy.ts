export class Lazy<T> {
  private readonly factory: () => T;
  private initialized: boolean;
  private value?: T;

  constructor(factory: () => T) {
    this.factory = factory;
    this.initialized = false;
  }

  public get(): T {
    if (!this.initialized) {
      this.value = this.factory();
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
