import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes, options, voters, pairwiseVotes } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const vote = await db.query.votes.findFirst({
		where: eq(votes.adminId, params.id)
	});

	if (!vote) {
		error(404, 'Not found');
	}

	const optionRows = await db.query.options.findMany({
		where: eq(options.voteId, vote.id),
		orderBy: options.position
	});

	const voterRows = await db.query.voters.findMany({
		where: eq(voters.voteId, vote.id)
	});

	const adminVoter = voterRows.find((v) => v.isAdmin);
	const regularVoters = voterRows.filter((v) => !v.isAdmin);

	const voterIds = voterRows.map((v) => v.id);
	const allVotes =
		voterIds.length > 0
			? await db.query.pairwiseVotes.findMany({
					where: inArray(pairwiseVotes.voterId, voterIds)
				})
			: [];

	const baseUrl = `${url.origin}/${vote.publicId}`;

	return {
		vote: {
			title: vote.title,
			publicId: vote.publicId,
			adminId: vote.adminId,
			createdAt: vote.createdAt.toISOString()
		},
		options: optionRows,
		voters: regularVoters.map((v) => ({
			id: v.id,
			name: v.name,
			token: v.token,
			link: `${baseUrl}/${v.token}`
		})),
		adminVoter: adminVoter
			? {
					id: adminVoter.id,
					name: adminVoter.name,
					token: adminVoter.token
				}
			: null,
		adminVotes: adminVoter
			? allVotes
					.filter((v) => v.voterId === adminVoter.id)
					.map((v) => ({
						optionAId: v.optionAId,
						optionBId: v.optionBId,
						winner: v.winner
					}))
			: [],
		allVotes: allVotes.map((v) => ({
			voterId: v.voterId,
			optionAId: v.optionAId,
			optionBId: v.optionBId,
			winner: v.winner
		})),
		voterIdMap: Object.fromEntries(voterRows.map((v) => [v.id, v.name]))
	};
};
