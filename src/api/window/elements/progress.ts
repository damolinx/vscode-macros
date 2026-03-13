import { BaseElementNode } from './baseElementNode';
import { ElementNodeOptions } from './elementNode';

export interface ProgressOptions extends ElementNodeOptions {
  readonly id: string;
}

export class Progress extends BaseElementNode<ProgressOptions> {
  public readonly elementRole = 'decoration';

  constructor(options: ProgressOptions) {
    super('progress', options);
  }

  public override get options(): ProgressOptions {
    return super.options!;
  }

  public override render(): string {
    const { id } = this.options;
    return `<div id="${id}" class="macro-progress indeterminate"></div>`;
  }
}
