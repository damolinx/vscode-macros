import { Attribute } from '../attributes/attribute';
import { Node, Role, RenderableNode } from '../node';
import { ElementNode, ElementNodeOptions } from './elementNode';

export abstract class BaseElementNode<
  TOptions extends ElementNodeOptions = ElementNodeOptions,
> implements ElementNode {
  public readonly role = 'element';

  protected constructor(
    public readonly kind: string,
    private readonly _options?: TOptions,
    public readonly children: Node[] = [],
  ) {}

  public get options(): TOptions | undefined {
    return this._options;
  }

  protected getAttributes(): Attribute[] {
    const attrs = this.getChildrenByRole<Attribute>('attribute');

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

      if (node.role === 'element' && 'children' in node && Array.isArray(node.children)) {
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
    kind: string,
    options?: { children?: Node[]; recursive?: boolean },
  ): TNode[] {
    return this.getChildren<TNode>((node: Node): node is TNode => node.kind === kind, options);
  }

  public getChildrenByRole<TNode extends Node = Node>(
    role: Role,
    options?: { children?: Node[]; recursive?: boolean },
  ): TNode[] {
    return this.getChildren<TNode>((node: Node): node is TNode => node.role == role, options);
  }

  public render(): string {
    const attrHtml = this.getAttributes().map((attr) => ` ${attr.render()}`);
    const childrenHtml = this.getChildren((c): c is RenderableNode =>
      ['content', 'element'].includes(c.role),
    ).map((child) => child.render());

    return `<macro-${this.kind}${attrHtml.join('')}>${childrenHtml.join('')}</macro-${this.kind}>`;
  }
}
