import * as vscode from 'vscode';

export class Lazy<T, TArgs extends unknown[] = []> {
  private readonly factory: (...args: TArgs) => T;
  private initialized: boolean;
  protected value?: T;

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

  public initialize(...args: TArgs): void {
    this.get(...args);
  }

  public isInitialized(): this is { value: T } {
    return this.initialized;
  }

  public reset(): void {
    if (this.initialized) {
      this.initialized = false;
      this.value = undefined;
    }
  }
}

export class LazyDisposable<
  T extends vscode.Disposable | vscode.Disposable[] | readonly vscode.Disposable[],
  TArgs extends unknown[] = [],
>
  extends Lazy<T, TArgs>
  implements vscode.Disposable
{
  dispose() {
    this.reset();
  }

  public override reset(): void {
    if (this.isInitialized()) {
      if (this.value instanceof Array) {
        vscode.Disposable.from(...this.value).dispose();
      } else {
        this.value.dispose();
      }
    }
    super.reset();
  }
}
