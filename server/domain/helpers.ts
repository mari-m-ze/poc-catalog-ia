/**
 * Validates if a value exists in an enum and returns it, or empty string if invalid
 */
export function validateEnum<T extends string>(value: string, enumValues: readonly T[]): T | '' {
  return enumValues.includes(value as T) ? value as T : '';
}

/**
 * Validates multiple enum values and returns an array of valid ones
 */
export function validateMultipleEnum<T extends string>(values: string | string[], enumValues: readonly T[]): T[] {
  if (!Array.isArray(values)) {
    values = [values];
  }
  return values.filter(value => enumValues.includes(value as T)) as T[];
}

/**
 * Validates and rounds a confidence value to ensure it's between 0 and 100
 */
export function validateConfidence(confidence: number): number {
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 100) {
    return 0;
  }
  return Math.round(confidence);
}

