import { StyleNode } from './styleNode';

export class Style implements StyleNode {
  public readonly kind = 'style';
  public readonly role = 'style';

  constructor(private readonly css: string) {}

  public get style(): string {
    return this.css;
  }

  public render(): string {
    return this.style;
  }
}
