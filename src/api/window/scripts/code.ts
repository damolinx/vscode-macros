import * as ts from 'typescript';

export interface StaticFunction {
  prototype: object;
  (...args: any[]): any;
}

export type Code = string | StaticFunction;
export type CodeStr = string & { readonly __brand: unique symbol };

export interface NormalizedCode {
  autoInvoke: boolean;
  normalizedCode: CodeStr;
}

export function normalizeCode(code: Code, name?: string): NormalizedCode {
  const isFunction = typeof code === 'function';
  const source = ts.createSourceFile(
    name ?? ((isFunction && code.name) || '__unnamed__'),
    isFunction ? code.toString() : code,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );

  let normalized = getTsPrinter().printFile(source) as CodeStr;
  if (isFunction && !code.prototype) {
    normalized = tryRewriteArrow(normalized);
  }

  return { normalizedCode: normalized, autoInvoke: isFunction };
}

// This is allows simple uses, and expose any incorrect assumptions
// about context since it runs in the Webview's, not the macro's.
function tryRewriteArrow(source: CodeStr): CodeStr {
  const index = source.indexOf('=>');
  if (index === -1) {
    return source;
  }

  let params = source.slice(0, index).trim();
  if (params.startsWith('(') && params.endsWith(')')) {
    params = params.slice(1, -1).trim();
  }

  let body = source.slice(index + 2).trim();
  if (!body.startsWith('{')) {
    body = `{ return ${body}; }`;
  } else if (body.endsWith('};')) {
    body = body.slice(0, -1).trim();
  }

  return `function(${params}) ${body}` as CodeStr;
}

let cachedPrinter: ts.Printer | undefined;
function getTsPrinter(): ts.Printer {
  cachedPrinter ??= ts.createPrinter({ removeComments: true });
  return cachedPrinter;
}
