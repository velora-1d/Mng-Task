import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const file = resolve(process.env.DB_FILE ?? 'data/mngtask.db');
mkdirSync(dirname(file), { recursive: true });

export const sqlite = createClient({ url: `file:${file}` });

// Pragma harus diset per koneksi. WAL membuat baca/tulis tidak saling blokir.
await sqlite.execute('PRAGMA journal_mode = WAL');
await sqlite.execute('PRAGMA foreign_keys = ON');
await sqlite.execute('PRAGMA busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
