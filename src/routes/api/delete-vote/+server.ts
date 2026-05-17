import { json, error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { adminId, confirmTitle } = body;

	if (!adminId || !confirmTitle) {
		error(400, 'Missing required fields');
	}

	const vote = await db.query.votes.findFirst({
		where: eq(votes.adminId, adminId)
	});

	if (!vote) {
		error(404, 'Vote not found');
	}

	if (confirmTitle !== vote.title) {
		error(400, 'Title does not match');
	}

	await db.delete(votes).where(eq(votes.id, vote.id));

	return json({ ok: true });
};
