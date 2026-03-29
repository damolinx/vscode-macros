import * as vscode from 'vscode';
import { Attribute } from '../attributes/attribute';
import { Text } from '../content/text';
import { BaseElementNode } from './baseElementNode';
import { ElementNodeOptions } from './elementNode';

export interface LinkOptions extends ElementNodeOptions {
  readonly href: string | vscode.Uri;
  readonly label?: string;
  readonly tabIndex?: number;
}

export class Link extends BaseElementNode<LinkOptions> {
  constructor(options: LinkOptions) {
    super('link', options, [new Text(options.label ? options.label : options.href.toString())]);
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();

    if (this.options) {
      attrs.push(new Attribute('href', this.options.href.toString()));

      if (this.options.tabIndex !== undefined) {
        attrs.push(new Attribute('tabIndex', this.options.tabIndex));
      }
    }

    return attrs;
  }
}

export function createLink(options: LinkOptions): Link {
  return new Link(options);
}
