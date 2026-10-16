export default function toCamelCase<T extends Record<string, unknown>>(
  row: T | null,
): Record<string, unknown> | null {
  if (row == null) return null;

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase()),
      value,
    ]),
  );
}
