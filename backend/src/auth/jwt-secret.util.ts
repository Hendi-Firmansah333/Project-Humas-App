const WEAK_PLACEHOLDER_SECRETS = new Set([
  'humass_secret_key_2026',
  'humass_production_secure_key_polinela_2026',
  'ganti_dengan_secret_acak_panjang_di_production',
  'secret',
  'changeme',
]);

/**
 * Mengembalikan JWT secret dari environment.
 * Di production (NODE_ENV=production / VERCEL=1), gagal secara eksplisit jika JWT_SECRET belum diset.
 */
export function getJwtSecret(): string {
  const envSecret = process.env['JWT_SECRET']?.trim();
  const isProd =
    process.env['NODE_ENV'] === 'production' || process.env['VERCEL'] === '1';

  if (envSecret && envSecret.length >= 16) {
    if (isProd && WEAK_PLACEHOLDER_SECRETS.has(envSecret)) {
      throw new Error(
        'JWT_SECRET menggunakan nilai placeholder yang tidak aman di production. Ganti dengan secret acak kuat (>= 32 karakter).',
      );
    }
    return envSecret;
  }

  if (isProd) {
    throw new Error(
      'JWT_SECRET wajib diset di environment production (minimal 16 karakter).',
    );
  }

  // Fallback khusus development/testing lokal (tidak pernah dipakai di production)
  return envSecret || 'dev_local_only_jwt_secret_not_for_prod';
}
