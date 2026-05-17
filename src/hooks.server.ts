import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '$lib/server/db';

await migrate(db, { migrationsFolder: 'drizzle' });
