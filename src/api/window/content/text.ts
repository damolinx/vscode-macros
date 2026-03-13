import { ContentNode } from './contentNode';

export class Text implements ContentNode {
  public readonly kind = 'text';
  public readonly role = 'content';

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
