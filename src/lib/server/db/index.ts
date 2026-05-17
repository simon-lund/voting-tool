import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { building } from '$app/environment';

const client = building ? undefined! : postgres(process.env.DATABASE_URL!);

export const db = building ? (undefined as never) : drizzle(client, { schema });
