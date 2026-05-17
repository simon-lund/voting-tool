import { building } from '$app/environment';

if (!building) {
	const { migrate } = await import('drizzle-orm/postgres-js/migrator');
	const { db } = await import('$lib/server/db');
	await migrate(db, { migrationsFolder: 'drizzle' });
}
