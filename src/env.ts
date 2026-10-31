import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Variabel environment yang dipakai aplikasi.
 * Diakses lewat `$app/env/private` (server) atau `$app/env/public` (browser).
 * `static: false` berarti dibaca saat runtime, bukan saat build.
 */
export const variables = defineEnvVars({
	DB_FILE: {
		description: 'Lokasi file SQLite. Default: data/mngtask.db',
		schema: (value) => value || 'data/mngtask.db'
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
