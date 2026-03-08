import { RenderableNode } from '../node';

export class Text implements RenderableNode {
  public readonly kind = 'text';
  public readonly renderKind = 'content';

  constructor(public readonly text: string) {}

  public render(): string {
    return escapeText(this.text);
  }
}

export function createText(text: string): Text {
  return new Text(text);
}

export function escapeText(text: string): string {
  return text.replace(/[&<>]/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return c;
    }
  });
}
