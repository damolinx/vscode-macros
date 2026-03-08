import { Attribute } from '../attributes/attribute';
import { Event } from '../attributes/event';
import { Node } from '../node';
import { createNodeFactory } from './common';
import { BaseElementNode, ElementNodeOptions } from './elementNode';

export interface TreeOptions extends ElementNodeOptions {
  readonly enableRemove?: true;
  readonly initialItems?: TreeNode[];
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  action?: { handlerName: string };
}

export class Tree extends BaseElementNode<TreeOptions> {
  constructor(options: TreeOptions | undefined, children: Node[]) {
    super('tree', options, children);
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();

    if (this.options) {
      if (this.options.enableRemove) {
        attrs.push(new Attribute('enable-remove', undefined));
      }
      if (this.options.initialItems?.length) {
        attrs.push(
          new Attribute('data-initial', JSON.stringify({ items: this.options.initialItems })),
        );
      }
    }
    return attrs;
  }
}

export const createTree = createNodeFactory<TreeOptions, Tree>(Tree);

export function createTreeNode(id: string, label: string, event?: Event): TreeNode {
  const node: TreeNode = { id, label };
  if (event && event.name === 'click') {
    node.action = { handlerName: event.handlerName };
  }
  return node;
}
