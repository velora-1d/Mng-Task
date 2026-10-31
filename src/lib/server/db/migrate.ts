import { migrate } from 'drizzle-orm/libsql/migrator';
import { sqlite, db } from './client';

await migrate(db, { migrationsFolder: 'drizzle' });

const { rows } = await sqlite.execute(
	"select count(*) as n from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '__drizzle%'"
);
console.log(`Migrasi selesai. ${rows[0].n} tabel siap.`);

await sqlite.close();
