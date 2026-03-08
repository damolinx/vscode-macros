import { AttributeNode } from './attributeNode';

export type AttributeValue = string | number | boolean | null | undefined;

export class Attribute implements AttributeNode {
  public readonly kind = 'attribute';
  public readonly renderKind = 'attribute';

  public constructor(
    public readonly name: string,
    public readonly value?: AttributeValue,
  ) {}

  public render(): string {
    if (this.value === null || this.value === undefined) {
      return this.name;
    }

    return `${this.name}="${escapeAttributeValue(this.value)}"`;
  }
}

export function createAttribute(name: string, value: AttributeValue): Attribute {
  return new Attribute(name, value);
}

export function escapeAttributeValue(value: any): string {
  return String(value).replace(/[&"<>]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return char;
    }
  });
}
