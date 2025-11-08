import { MACRO_LANGUAGES } from '../core/language';

export const NaturalComparer = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const MacroFilter: Record<string, string[]> = Object.fromEntries(
  Object.values(MACRO_LANGUAGES).map(({ name, extensions }) => [
    name,
    extensions.map((ext) => ext.substring(1)),
  ]),
);
