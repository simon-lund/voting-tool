import { pgTable, serial, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const votes = pgTable('votes', {
	id: serial('id').primaryKey(),
	publicId: text('public_id').notNull().unique(),
	adminId: text('admin_id').notNull().unique(),
	title: text('title').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const options = pgTable('options', {
	id: serial('id').primaryKey(),
	voteId: integer('vote_id')
		.notNull()
		.references(() => votes.id, { onDelete: 'cascade' }),
	label: text('label').notNull(),
	position: integer('position').notNull()
});

export const voters = pgTable('voters', {
	id: serial('id').primaryKey(),
	voteId: integer('vote_id')
		.notNull()
		.references(() => votes.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	name: text('name').notNull(),
	isAdmin: boolean('is_admin').notNull().default(false)
});

export const pairwiseVotes = pgTable(
	'pairwise_votes',
	{
		id: serial('id').primaryKey(),
		voterId: integer('voter_id')
			.notNull()
			.references(() => voters.id, { onDelete: 'cascade' }),
		optionAId: integer('option_a_id')
			.notNull()
			.references(() => options.id, { onDelete: 'cascade' }),
		optionBId: integer('option_b_id')
			.notNull()
			.references(() => options.id, { onDelete: 'cascade' }),
		winner: text('winner').notNull() // 'a' | 'b'
	},
	(t) => [unique().on(t.voterId, t.optionAId, t.optionBId)]
);

export const votesRelations = relations(votes, ({ many }) => ({
	options: many(options),
	voters: many(voters)
}));

export const optionsRelations = relations(options, ({ one }) => ({
	vote: one(votes, { fields: [options.voteId], references: [votes.id] })
}));

export const votersRelations = relations(voters, ({ one, many }) => ({
	vote: one(votes, { fields: [voters.voteId], references: [votes.id] }),
	pairwiseVotes: many(pairwiseVotes)
}));

export const pairwiseVotesRelations = relations(pairwiseVotes, ({ one }) => ({
	voter: one(voters, { fields: [pairwiseVotes.voterId], references: [voters.id] }),
	optionA: one(options, { fields: [pairwiseVotes.optionAId], references: [options.id] }),
	optionB: one(options, { fields: [pairwiseVotes.optionBId], references: [options.id] })
}));
