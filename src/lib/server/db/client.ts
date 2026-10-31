import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const connectionString =
	process.env.DATABASE_URL ||
	'postgresql://neondb_owner:dummy@ep-dummy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
