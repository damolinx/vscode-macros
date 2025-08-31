import { MACRO_LANGUAGES } from '../core/language';

export const NaturalComparer = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function macroFilter(): Record<string, string[]> {
  return Object.fromEntries(MACRO_LANGUAGES.map(({ name, extensions }) => [name, [...extensions]]));
}
