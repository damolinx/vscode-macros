import { Attribute } from '../attributes/attribute';
import { Kind, Node, ParentNode, RenderKind, RenderableNode, isHtmlRenderable } from '../node';

export type ElementKind = Extract<Kind, 'button' | 'container' | 'input' | 'tree'>;

export interface ElementNode extends ParentNode, RenderableNode {
  readonly kind: ElementKind;
  readonly renderKind: 'element';
}

export interface ElementNodeOptions {
  readonly id?: string;
}

export abstract class BaseElementNode<
  TOptions extends ElementNodeOptions = ElementNodeOptions,
> implements RenderableNode {
  public readonly renderKind = 'element';

  constructor(
    public readonly kind: ElementKind,
    public readonly options?: TOptions,
    public readonly children: Node[] = [],
  ) {}

  protected getAttributes(): Attribute[] {
    const attrs = this.getChildrenByRenderKind<Attribute>('attribute');

    if (this.options?.id) {
      attrs.push(new Attribute('id', this.options.id));
    }
    return attrs;
  }

  protected getChildren<TNode extends Node = Node>(
    predicate: (node: Node) => node is TNode,
    {
      children = this.children,
      recursive = false,
    }: { children?: Node[]; recursive?: boolean } = {},
  ): TNode[] {
    if (!recursive) {
      return children.filter(predicate);
    }

    const result: TNode[] = [];

    const visit = (node: Node) => {
      if (predicate(node)) {
        result.push(node);
      }

      if (node.renderKind === 'element' && 'children' in node && Array.isArray(node.children)) {
        for (const child of node.children) {
          visit(child);
        }
      }
    };

    for (const child of children) {
      visit(child);
    }

    return result;
  }

  public getChildrenByKind<TNode extends Node = Node>(
    kind: Kind,
    options?: { children?: Node[]; recursive?: boolean },
  ): TNode[] {
    return this.getChildren<TNode>((node: Node): node is TNode => node.kind === kind, options);
  }

  public getChildrenByRenderKind<TNode extends Node = Node>(
    renderKind: RenderKind,
    options?: { children?: Node[]; recursive?: boolean },
  ): TNode[] {
    return this.getChildren<TNode>(
      (node: Node): node is TNode => node.renderKind == renderKind,
      options,
    );
  }

  public render(): string {
    const attrHtml = this.getAttributes().map((attr) => ` ${attr.render()}`);
    const childrenHtml = this.getChildren(isHtmlRenderable).map((child) => child.render());

    return `<macro-${this.kind}${attrHtml.join('')}>${childrenHtml.join('')}</macro-${this.kind}>`;
  }
}
