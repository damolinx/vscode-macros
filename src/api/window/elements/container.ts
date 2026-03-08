import { Attribute } from '../attributes/attribute';
import { Node, RenderableNode } from '../node';
import { createNodeFactory } from './common';
import { BaseElementNode, ElementNodeOptions } from './elementNode';

export type ContainerMode = 'fixed' | 'scrollable';

export interface ContainerOptions extends ElementNodeOptions {
  readonly mode: ContainerMode;
}

export class Container extends BaseElementNode<ContainerOptions> {
  public readonly mode: ContainerMode;
  constructor(options: ContainerOptions | undefined, children: Node[]) {
    super('container', options, children);
    this.mode = this.options?.mode ?? 'scrollable';
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();
    attrs.push(new Attribute('mode', this.mode));
    return attrs;
  }
}

export const createContainer = createNodeFactory<ContainerOptions, Container>(Container);

export interface ContainerModeGroups {
  fixed: Container[];
  scrollable: Container[];
  other: RenderableNode[];
}

export function groupByContainerMode(nodes: RenderableNode[]): ContainerModeGroups {
  const grouped: ContainerModeGroups = {
    fixed: [],
    scrollable: [],
    other: [],
  };

  for (const node of nodes) {
    if (node instanceof Container) {
      grouped[node.mode].push(node);
    } else {
      grouped.other.push(node);
    }
  }
  return grouped;
}
