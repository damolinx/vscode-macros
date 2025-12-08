import { MACRO_LANGUAGES } from '../core/language';

export const NaturalComparer = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const MacroFilter: Record<string, string[]> = Object.fromEntries(
  Object.values(MACRO_LANGUAGES).map(({ name, extensions }) => [
    name,
    extensions.map((ext) => ext.substring(1)),
  ]),
);

export function formatStartTimestampLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 2,
  });

  if (isSameDay) {
    return `Started at ${time}`;
  }

  const day = date.toLocaleDateString([], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

  return `Started on ${day} at ${time}`;
}
