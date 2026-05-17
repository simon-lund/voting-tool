import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes, voters } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '$lib/server/ids';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const body = await request.json();
	const { adminId, name } = body;

	if (!adminId || !name?.trim()) {
		error(400, 'Missing required fields');
	}

	const vote = await db.query.votes.findFirst({
		where: eq(votes.adminId, adminId)
	});

	if (!vote) {
		error(404, 'Vote not found');
	}

	const token = generateToken();
	const [newVoter] = await db
		.insert(voters)
		.values({
			voteId: vote.id,
			token,
			name: name.trim(),
			isAdmin: false
		})
		.returning();

	const baseUrl = `${url.origin}/${vote.publicId}`;

	return json({
		ok: true,
		voter: {
			id: newVoter.id,
			name: newVoter.name,
			token: newVoter.token,
			link: `${baseUrl}/${newVoter.token}`
		}
	});
};
