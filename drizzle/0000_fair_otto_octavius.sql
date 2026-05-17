CREATE TABLE "options" (
	"id" serial PRIMARY KEY NOT NULL,
	"vote_id" integer NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairwise_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voter_id" integer NOT NULL,
	"option_a_id" integer NOT NULL,
	"option_b_id" integer NOT NULL,
	"winner" text NOT NULL,
	CONSTRAINT "pairwise_votes_voter_id_option_a_id_option_b_id_unique" UNIQUE("voter_id","option_a_id","option_b_id")
);
--> statement-breakpoint
CREATE TABLE "voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"vote_id" integer NOT NULL,
	"token" text NOT NULL,
	"name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "voters_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"admin_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "votes_admin_id_unique" UNIQUE("admin_id")
);
--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairwise_votes" ADD CONSTRAINT "pairwise_votes_voter_id_voters_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairwise_votes" ADD CONSTRAINT "pairwise_votes_option_a_id_options_id_fk" FOREIGN KEY ("option_a_id") REFERENCES "public"."options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairwise_votes" ADD CONSTRAINT "pairwise_votes_option_b_id_options_id_fk" FOREIGN KEY ("option_b_id") REFERENCES "public"."options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;