import { ElementNodeOptions } from '../elements/elementNode';
import { Progress } from '../elements/progress';
import { Node } from '../node';
import { Script } from '../scripts/script';
import { Style } from '../style/style';
import { ExpansionContext } from './expansionContext';
import { MetaNode } from './metaNode';

export class ProgressMeta implements MetaNode {
  public readonly kind = 'progress';
  public readonly role = 'meta';

  constructor(private readonly options?: ElementNodeOptions) {}

  public expand(context: ExpansionContext): Node[] {
    const id = this.options?.id ?? `__progress_${context.nextId(this.kind)}`;

    return [new Progress({ id }), new Script(getScript(id)), new Style(getCss())];
  }
}

function getCss(): string {
  return `
  .macro-progress {
    height: 2px;
    opacity: 0;
    overflow: hidden;
    position: relative;
    background: transparent;
  }

  .macro-progress.indeterminate::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: var(--vscode-progressBar-background);
    transform-origin: left center;
    animation: macro-progress-indeterminate 4s infinite linear;
  }

  @keyframes macro-progress-indeterminate {
    0%   { transform: translateX(0%)   scaleX(0.02); }
    50%  { transform: translateX(50%)  scaleX(0.07); }
    100% { transform: translateX(100%) scaleX(0.02); }
  }
`;
}

function getScript(id: string): () => string {
  return () => `
      (function() {
        const el = document.getElementById("${id}");
        if (!el) { return; }

        macro.progress = {
          show() {
            el.style.opacity = "1";
            el.classList.remove("indeterminate");
            void el.offsetWidth;
            el.classList.add("indeterminate");
          },
          hide() {
            el.style.opacity = "0";
            el.classList.remove("indeterminate");
          }
        };
      })();`;
}
