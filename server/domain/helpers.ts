import { log } from '../vite';

/**
 * Validates if a value exists in an enum and returns it, or empty string if invalid
 */
export function validateEnum<T extends string>(value: string, enumValues: readonly T[]): T | '' {
  if (!enumValues.includes(value as T)) {
    log(`Validation failed: value "${value}" is not in enum [${enumValues.join(', ')}]`);
    return '';
  }
  return value as T;
}

/**
 * Validates multiple enum values and returns an array of valid ones
 */
export function validateMultipleEnum<T extends string>(values: string | string[], enumValues: readonly T[]): T[] {
  if (!Array.isArray(values)) {
    values = [values];
  }
  const validValues = values.filter(value => enumValues.includes(value as T)) as T[];
  const invalidValues = values.filter(value => !enumValues.includes(value as T));
  if (invalidValues.length > 0) {
    log(`Validation failed: values [${invalidValues.join(', ')}] are not in enum [${enumValues.join(', ')}]`);
  }
  return validValues;
}

/**
 * Validates and rounds a confidence value to ensure it's between 0 and 100
 */
export function validateConfidence(confidence: number | string): number {
  const num = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
  if (isNaN(num) || num < 0 || num > 100) {
    log(`Validation failed: confidence value "${confidence}" is not a valid number between 0 and 100`);
    return 0;
  }
  return Math.round(num);
}

