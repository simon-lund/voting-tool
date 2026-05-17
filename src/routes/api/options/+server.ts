import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes, options } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { adminId, label } = body;

	if (!adminId || !label?.trim()) {
		error(400, 'Missing required fields');
	}

	const vote = await db.query.votes.findFirst({
		where: eq(votes.adminId, adminId)
	});

	if (!vote) {
		error(404, 'Vote not found');
	}

	const existing = await db.query.options.findMany({
		where: eq(options.voteId, vote.id)
	});

	const maxPosition = existing.length > 0 ? Math.max(...existing.map((o) => o.position)) : -1;

	const [newOption] = await db
		.insert(options)
		.values({
			voteId: vote.id,
			label: label.trim(),
			position: maxPosition + 1
		})
		.returning();

	return json({ ok: true, option: newOption });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { adminId, optionId } = body;

	if (!adminId || !optionId) {
		error(400, 'Missing required fields');
	}

	const vote = await db.query.votes.findFirst({
		where: eq(votes.adminId, adminId)
	});

	if (!vote) {
		error(404, 'Vote not found');
	}

	const option = await db.query.options.findFirst({
		where: and(eq(options.id, optionId), eq(options.voteId, vote.id))
	});

	if (!option) {
		error(404, 'Option not found');
	}

	await db.delete(options).where(eq(options.id, optionId));

	return json({ ok: true });
};
