import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: `file:${resolve(process.env.DB_FILE ?? 'data/mngtask.db')}`
	},
	strict: true,
	verbose: true
});
