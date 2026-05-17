import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pairwiseVotes, voters } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { voterToken, optionAId, optionBId, winner } = body;

	if (!voterToken || !optionAId || !optionBId) {
		error(400, 'Missing required fields');
	}

	if (winner !== 'a' && winner !== 'b' && winner !== null) {
		error(400, 'Invalid winner value');
	}

	const voter = await db.query.voters.findFirst({
		where: eq(voters.token, voterToken)
	});

	if (!voter) {
		error(404, 'Voter not found');
	}

	const [lowId, highId] =
		optionAId < optionBId ? [optionAId, optionBId] : [optionBId, optionAId];

	const existing = await db.query.pairwiseVotes.findFirst({
		where: and(
			eq(pairwiseVotes.voterId, voter.id),
			eq(pairwiseVotes.optionAId, lowId),
			eq(pairwiseVotes.optionBId, highId)
		)
	});

	if (winner === null) {
		if (existing) {
			await db.delete(pairwiseVotes).where(eq(pairwiseVotes.id, existing.id));
		}
		return json({ ok: true });
	}

	const normalizedWinner =
		optionAId < optionBId ? winner : winner === 'a' ? 'b' : 'a';

	if (existing) {
		await db
			.update(pairwiseVotes)
			.set({ winner: normalizedWinner })
			.where(eq(pairwiseVotes.id, existing.id));
	} else {
		await db.insert(pairwiseVotes).values({
			voterId: voter.id,
			optionAId: lowId,
			optionBId: highId,
			winner: normalizedWinner
		});
	}

	return json({ ok: true });
};
