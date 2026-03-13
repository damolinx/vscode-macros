import { Attribute } from '../attributes/attribute';
import { Node } from '../node';
import { BaseElementNode } from './baseElementNode';
import { createNodeFactory } from './common';
import { ElementNodeOptions } from './elementNode';

export interface InputOptions extends ElementNodeOptions {
  readonly placeholder?: string;
  readonly tabIndex?: number;
  readonly type?: 'email' | 'number' | 'password' | 'text';
  readonly value?: string;
}

export class Input extends BaseElementNode<InputOptions> {
  constructor(options: InputOptions | undefined, children: Node[]) {
    super('input', options, children);
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();
    attrs.push(new Attribute('type', this.options?.type ?? 'text'));

    if (this.options) {
      if (this.options.placeholder) {
        attrs.push(new Attribute('placeholder', this.options.placeholder));
      }
      if (this.options.tabIndex !== undefined) {
        attrs.push(new Attribute('tabIndex', this.options.tabIndex));
      }
      if (this.options.value) {
        attrs.push(new Attribute('value', this.options.value));
      }
    }
    return attrs;
  }
}

export const createInput = createNodeFactory<InputOptions, Input>(Input);
