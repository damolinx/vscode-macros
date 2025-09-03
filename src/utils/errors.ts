export function cleanError<T extends Error>(error: T): T {
  const clone = cloneError<T>(error);

  if (clone.stack) {
    clone.stack = clone.stack.replace(/\n.+?(vscode|damolinx)-macros.*$/s, '');
  }
  if ('requireStack' in clone) {
    clone.message = clone.message.replace(/\nRequire stack:.*$/s, '');
    clone.requireStack = [];
  }
  return clone;
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
