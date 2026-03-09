type CanonicalValue =
  | null
  | string
  | number
  | boolean
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function canonicalizeValue(value: unknown): CanonicalValue {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }

  if (typeof value === "object") {
    return canonicalizeObject(value as Record<string, unknown>);
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  throw new TypeError(`Unsupported payload value type: ${typeof value}`);
}

export function canonicalizeObject(
  input: Record<string, unknown>,
): Record<string, CanonicalValue> {
  const sortedKeys = Object.keys(input).sort((a, b) => a.localeCompare(b));
  const result: Record<string, CanonicalValue> = {};

  for (const key of sortedKeys) {
    const value = input[key];
    if (value === undefined) {
      continue;
    }

    result[key] = canonicalizeValue(value);
  }

  return result;
}

export function canonicalizePayload(payload: object): string {
  const canonical = canonicalizeObject(payload as Record<string, unknown>);
  return JSON.stringify(canonical);
}
