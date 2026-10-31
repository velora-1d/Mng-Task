import { env } from '$env/dynamic/private';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedPool: Pool | null = null;
let platformEnv: Record<string, string> | null = null;

export function setPlatformEnv(newEnv: unknown) {
	if (newEnv && typeof newEnv === 'object') {
		platformEnv = newEnv as Record<string, string>;
	}
}

function getConnectionString(): string {
	const conn =
		platformEnv?.DATABASE_URL ||
		env.DATABASE_URL ||
		(typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined);

	if (!conn) {
		throw new Error(
			'DATABASE_URL is not set. Please configure DATABASE_URL in Cloudflare Dashboard (Variables and Secrets) or wrangler.jsonc or .env file.'
		);
	}
	return conn;
}

export function getDb() {
	if (!cachedDb) {
		const connectionString = getConnectionString();
		cachedPool = new Pool({ connectionString });
		cachedDb = drizzle(cachedPool, { schema });
	}
	return cachedDb;
}

export const pool = new Proxy({} as Pool, {
	get(_target, prop) {
		getDb();
		return (cachedPool as any)[prop];
	}
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop) {
		const targetDb = getDb();
		const val = (targetDb as any)[prop];
		if (typeof val === 'function') {
			return val.bind(targetDb);
		}
		return val;
	}
});

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
