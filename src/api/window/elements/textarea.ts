import { Attribute } from '../attributes/attribute';
import { Node } from '../node';
import { BaseElementNode } from './baseElementNode';
import { createNodeFactory } from './common';
import { ElementNodeOptions } from './elementNode';

export interface TextareaOptions extends ElementNodeOptions {
  readonly maxRows?: number;
  readonly minRows?: number;
  readonly placeholder?: string;
  readonly readonly?: true;
  readonly tabIndex?: number;
  readonly value?: string;
}

export class Textarea extends BaseElementNode<TextareaOptions> {
  constructor(options: TextareaOptions | undefined, children: Node[]) {
    super('textarea', options, children);
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();

    if (this.options) {
      const { minRows, maxRows } = Textarea.getRowConstraints(this.options);
      if (this.options.readonly) {
        attrs.push(new Attribute('readonly'));
        attrs.push(new Attribute('rows', minRows));
      } else {
        attrs.push(new Attribute('data-min-rows', minRows));
        if (maxRows !== undefined) {
          attrs.push(new Attribute('data-max-rows', maxRows));
        }
      }

      if (this.options.placeholder) {
        attrs.push(new Attribute('placeholder', this.options.placeholder));
      }
      if (this.options.tabIndex !== undefined) {
        attrs.push(new Attribute('tabIndex', this.options.tabIndex));
      }
      if (this.options.value !== undefined) {
        attrs.push(new Attribute('value', String(this.options.value)));
      }
    }

    return attrs;
  }

  private static getRowConstraints(options: TextareaOptions | undefined) {
    const minRows = Math.max(1, options?.minRows ?? 1);

    let maxRows = options?.maxRows;
    if (maxRows !== undefined) {
      maxRows = Math.max(1, maxRows);
    }

    return { minRows, maxRows };
  }
}

export const createTextarea = createNodeFactory<TextareaOptions, Textarea>(Textarea);
