export function cleanError<T extends Error>(error: T, repl?: true): T {
  let clone: T | undefined;

  if (error.stack) {
    clone ??= cloneError(error);
    clone.stack = cleanStack(error.stack, repl);
  }

  if ('requireStack' in error) {
    clone ??= cloneError<T>(error);
    clone.message = clone.message.replace(/\nRequire stack:.*$/s, '');
    (clone as T & { requireStack: string[] }).requireStack = [];
  }

  return clone ?? error;
}

export function cleanStack(stack: string, repl?: boolean) {
  return (repl ? stack.replace(/^.*(?:evalmachine\.).*\n*$/gm, '') : stack)
    .replace(/^(.*?(?:new Script|\.runIn(?:New)?Context|(?:vscode-macros[\/\\]src|damolinx-macros))[\s\S]*)$/m, '')
    .replace(/^(.*?vscode-file:\/\/[\s\S]*)$/m, '')
    .trim();
}

export function cloneError<T extends Error>(error: T): T {
  const clone = Object.create(Object.getPrototypeOf(error)) as T;

  const descriptors = Object.getOwnPropertyDescriptors(error);
  for (const name of Object.keys(descriptors) as (keyof T)[]) {
    const descriptor = descriptors[name];
    if ('value' in descriptor) {
      clone[name] = error[name];
    } else if (typeof descriptor.get === 'function') {
      try {
        Object.defineProperty(clone, name, {
          configurable: true,
          enumerable: descriptor.enumerable ?? true,
          value: error[name],
          writable: true,
        });
      } catch (e) {
        console.error("Failed to set property '%s' —", name, e);
      }
    }
  }

  return clone;
}
