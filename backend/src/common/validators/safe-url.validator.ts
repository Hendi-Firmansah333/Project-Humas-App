import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const DANGEROUS_SCHEME_REGEX = /^\s*(javascript|vbscript|data|file):/i;

/**
 * Validasi URL aman (mencegah payload javascript:, data:, vbscript:, file:).
 * Mengizinkan string kosong, path relatif (/...), http://, https://, atau host tanpa skema berbahaya.
 */
export function IsSafeHttpUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeHttpUrl',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} mengandung skema URL yang tidak diizinkan (hanya http/https).`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          const trimmed = value.trim();
          if (!trimmed) return true;
          if (DANGEROUS_SCHEME_REGEX.test(trimmed)) return false;
          if (trimmed.includes('://')) {
            return /^https?:\/\//i.test(trimmed);
          }
          return true;
        },
      },
    });
  };
}
