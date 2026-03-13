import { Attribute } from '../attributes/attribute';
import { Node } from '../node';
import { BaseElementNode } from './baseElementNode';
import { createNodeFactory } from './common';
import { ElementNodeOptions, ElementRole } from './elementNode';

export type ContainerMode = 'fixed' | 'scrollable';

export interface ContainerOptions extends ElementNodeOptions {
  readonly mode: ContainerMode;
}

export class Container extends BaseElementNode<ContainerOptions> {
  public readonly elementRole: ElementRole;
  public readonly mode: ContainerMode;

  constructor(options: ContainerOptions | undefined, children: Node[]) {
    super('container', options, children);
    this.elementRole = 'container';
    this.mode = this.options?.mode ?? 'scrollable';
  }

  protected override getAttributes(): Attribute[] {
    const attrs = super.getAttributes();
    attrs.push(new Attribute('mode', this.mode));
    return attrs;
  }
}

export const createContainer = createNodeFactory<ContainerOptions, Container>(Container);
