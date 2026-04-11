import { MarkupNode, Node } from '../node';

export type ElementRole = 'container' | 'decoration';

export interface ElementNodeOptions {
  readonly class?: string;
  readonly id?: string;
}

export interface ElementNode extends MarkupNode {
  readonly role: 'element';
  readonly children: Node[];
  readonly elementRole?: ElementRole;
}

export interface DecorationNode extends ElementNode {
  readonly elementRole: 'decoration';
}

export function isElement(n: Node): n is ElementNode {
  return (n as any).role === 'element';
}

export function isElementOfRole(n: Node, elementRole: ElementRole): n is ElementNode {
  return isElement(n) && n.elementRole === elementRole;
}
