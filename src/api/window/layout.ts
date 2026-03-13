import { Container } from './elements/container';
import { isElementOfRole } from './elements/elementNode';
import { RenderableNode } from './node';

export interface Layout {
  readonly decorations: RenderableNode[];
  readonly fixed: Container[];
  readonly scrollable: Container[];
  readonly other: RenderableNode[];
}

export function getLayout(nodes: RenderableNode[]): Layout {
  const layout: Layout = {
    decorations: [],
    fixed: [],
    scrollable: [],
    other: [],
  };

  for (const node of nodes) {
    if (isElementOfRole(node, 'decoration')) {
      layout.decorations.push(node);
    } else if (node instanceof Container) {
      layout[node.mode].push(node);
    } else {
      layout.other.push(node);
    }
  }
  return layout;
}
