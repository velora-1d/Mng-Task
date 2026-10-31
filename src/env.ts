import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Variabel environment yang dipakai aplikasi.
 * Diakses lewat `$app/env/private` (server) atau `$app/env/public` (browser).
 * `static: false` berarti dibaca saat runtime, bukan saat build.
 */
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Koneksi pooled PostgreSQL Neon.',
		schema: (value) => value
	},
	DATABASE_URL_UNPOOLED: {
		description: 'Koneksi unpooled direct PostgreSQL Neon.',
		schema: (value) => value
	},
	NEON_BRANCH: {
		description: 'Nama branch Neon aktif.',
		schema: (value) => value
	},
	NEON_AUTH_BASE_URL: {
		description: 'URL base Neon Auth.',
		schema: (value) => value
	},
	NEON_AUTH_JWKS_URL: {
		description: 'URL JWKS endpoint Neon Auth.',
		schema: (value) => value
	},
	NEON_FUNCTION_HELLO_BASE_URL: {
		description: 'URL endpoint Neon Function hello.',
		schema: (value) => value
	},
	NEON_REALTIME_URL: {
		description: 'URL Neon Realtime.',
		schema: (value) => value
	},
	NEON_REALTIME_SECRET: {
		description: 'Secret untuk sign/seal Neon Realtime live queries.',
		schema: (value) => value
	},
	AWS_ACCESS_KEY_ID: {
		description: 'Access Key ID untuk Neon Object Storage.',
		schema: (value) => value
	},
	AWS_SECRET_ACCESS_KEY: {
		description: 'Secret Access Key untuk Neon Object Storage.',
		schema: (value) => value
	},
	AWS_ENDPOINT_URL_S3: {
		description: 'S3 Endpoint URL untuk Neon Object Storage.',
		schema: (value) => value
	},
	AWS_REGION: {
		description: 'AWS Region untuk Neon Object Storage.',
		schema: (value) => value
	},
	SESSION_COOKIE_NAME: {
		description: 'Nama cookie sesi.',
		schema: (value) => value || 'mngtask_session'
	},
	SESSION_TTL_DAYS: {
		description: 'Masa berlaku sesi dalam hari.',
		schema: (value) => value || '7'
	},
	ORIGIN: {
		description: 'Origin publik aplikasi di produksi (dipakai adapter-node).',
		schema: (value) => value
	}
});
