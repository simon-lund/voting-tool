import { produce } from 'sveltekit-sse';
import { db } from '$lib/server/db';
import { votes, voters, pairwiseVotes } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { votePublicId } = await request.json();

	return produce(async function start({ emit }) {
		const vote = await db.query.votes.findFirst({
			where: eq(votes.publicId, votePublicId)
		});

		if (!vote) return () => {};

		const poll = async () => {
			const allVoters = await db.query.voters.findMany({
				where: eq(voters.voteId, vote.id)
			});
			const voterIds = allVoters.map((v) => v.id);
			const allVotes =
				voterIds.length > 0
					? await db.query.pairwiseVotes.findMany({
							where: inArray(pairwiseVotes.voterId, voterIds)
						})
					: [];

			const { error } = emit(
				'votes',
				JSON.stringify(
					allVotes.map((v) => ({
						voterId: v.voterId,
						optionAId: v.optionAId,
						optionBId: v.optionBId,
						winner: v.winner
					}))
				)
			);
			if (error) return false;
			return true;
		};

		await poll();

		const interval = setInterval(async () => {
			const ok = await poll();
			if (!ok) clearInterval(interval);
		}, 3000);

		return () => clearInterval(interval);
	});
};
