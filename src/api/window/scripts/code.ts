// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type Code = string | Function;

export function normalizeCode(code: Code) {
  return code.toString().replace(/(\/\/.*$)|\s*\n\s*/gm, (_match, comment) => (comment ? '' : ' '));
}
