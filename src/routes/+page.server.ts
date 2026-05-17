import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { votes, options, voters } from '$lib/server/db/schema';
import { generateToken } from '$lib/server/ids';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const optionsRaw = (data.get('options') as string)?.trim();
		const numVoters = parseInt(data.get('numVoters') as string) || 1;

		if (!title || !optionsRaw) {
			return { error: 'Title and options are required.' };
		}

		const optionLabels = optionsRaw
			.split(/[\n,;]+/)
			.map((s) => s.trim())
			.filter(Boolean);

		const seen = new Set<string>();
		const uniqueLabels: string[] = [];
		for (const l of optionLabels) {
			const key = l.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				uniqueLabels.push(l);
			}
		}

		if (uniqueLabels.length < 2) {
			return { error: 'Add at least 2 options.' };
		}

		const publicId = generateToken();
		const adminId = generateToken();

		const [vote] = await db
			.insert(votes)
			.values({ publicId, adminId, title })
			.returning({ id: votes.id });

		await db.insert(options).values(
			uniqueLabels.map((label, i) => ({
				voteId: vote.id,
				label,
				position: i
			}))
		);

		const adminVoter = {
			voteId: vote.id,
			token: generateToken(),
			name: 'Admin',
			isAdmin: true
		};

		const voterRows = Array.from({ length: numVoters }, (_, i) => ({
			voteId: vote.id,
			token: generateToken(),
			name: `Voter ${i + 1}`,
			isAdmin: false
		}));

		await db.insert(voters).values([adminVoter, ...voterRows]);

		redirect(303, `/${adminId}`);
	}
} satisfies Actions;
