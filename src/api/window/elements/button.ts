import { Attribute } from '../attributes/attribute';
import { createText } from '../content/text';
import { Node } from '../node';
import { BaseElementNode } from './baseElementNode';
import { createNodeFactory } from './common';
import { ElementNodeOptions } from './elementNode';

export interface ButtonOptions extends ElementNodeOptions {
  readonly label?: string;
  readonly tabIndex?: number;
  readonly toggle?: true;
}

export class Button extends BaseElementNode<ButtonOptions> {
  constructor(options: ButtonOptions | undefined, children: Node[]) {
    super('button', options, children);
    if (this.options?.label !== undefined) {
      this.children.unshift(createText(this.options.label));
    }
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();

    if (this.options) {
      if (this.options.tabIndex !== undefined) {
        attrs.push(new Attribute('tabIndex', this.options.tabIndex));
      }
      if (this.options.toggle) {
        attrs.push(new Attribute('toggle', undefined));
      }
    }
    return attrs;
  }
}

export const createButton = createNodeFactory<ButtonOptions, Button>(Button);
