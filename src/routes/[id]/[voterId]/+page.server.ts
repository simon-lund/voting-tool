import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes, options, voters, pairwiseVotes } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const vote = await db.query.votes.findFirst({
		where: eq(votes.publicId, params.id)
	});

	if (!vote) {
		error(404, 'Not found');
	}

	const voter = await db.query.voters.findFirst({
		where: and(eq(voters.token, params.voterId), eq(voters.voteId, vote.id))
	});

	if (!voter) {
		error(404, 'Not found');
	}

	const optionRows = await db.query.options.findMany({
		where: eq(options.voteId, vote.id),
		orderBy: options.position
	});

	const voterVotes = await db.query.pairwiseVotes.findMany({
		where: eq(pairwiseVotes.voterId, voter.id)
	});

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

	const totalPairs = (optionRows.length * (optionRows.length - 1)) / 2;

	return {
		vote: { title: vote.title },
		voter: { name: voter.name, token: voter.token },
		options: optionRows,
		votes: voterVotes.map((v) => ({
			optionAId: v.optionAId,
			optionBId: v.optionBId,
			winner: v.winner
		})),
		allVotes: allVotes.map((v) => ({
			voterId: v.voterId,
			optionAId: v.optionAId,
			optionBId: v.optionBId,
			winner: v.winner
		})),
		totalPairs
	};
};
