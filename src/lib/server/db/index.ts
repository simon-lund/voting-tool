import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

const client = building ? undefined! : postgres(env.DATABASE_URL!);

export const db = building ? (undefined as never) : drizzle(client, { schema });
