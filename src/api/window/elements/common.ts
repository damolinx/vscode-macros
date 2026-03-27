import { Node } from '../node';
import { ElementNode, ElementNodeOptions } from './elementNode';

export function createNodeFactory<TOptions extends ElementNodeOptions, TNode extends ElementNode>(
  constructor: new (options: TOptions | undefined, children: Node[]) => TNode,
) {
  return function createNode(first: Node | TOptions | undefined, ...rest: Node[]): TNode {
    const { options, children } = normalizeOptionsAndChildren<TOptions>(first, rest);
    return new constructor(options, children);
  };
}

function normalizeOptionsAndChildren<TOptions extends ElementNodeOptions>(
  childOrOptions: Node | TOptions | undefined,
  restChildren: Node[],
): { children: Node[]; options: TOptions | undefined } {
  let children: Node[];
  let options: TOptions | undefined;

  if (childOrOptions && 'kind' in childOrOptions) {
    children = [childOrOptions, ...restChildren];
  } else {
    options = childOrOptions;
    children = restChildren;
  }

  return { options, children };
}
