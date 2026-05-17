# pairwise vote

A lightweight group voting tool using pairwise comparisons. Create a vote, share individual links with participants, and see aggregated results ranked by Copeland scoring.

## How it works

1. **Create a vote** — set a title, add options, choose how many voters
2. **Share links** — each voter gets a unique link; the admin gets a separate link to manage everything
3. **Vote** — each participant fills out a pairwise comparison matrix (arrow left = prefer row, arrow up = prefer column)
4. **Results** — the admin view shows live Copeland-ranked results

URL scheme:
- `/<admin_id>` — admin view (manage + vote)
- `/<vote_id>/<voter_id>` — voter view

No login required. Access is controlled via obfuscated URL tokens.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) + TypeScript
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn-svelte](https://shadcn-svelte.com/)
- [Lucide](https://lucide.dev/) icons

## Development

```sh
# install dependencies
pnpm install

# start postgres (docker)
docker run -d --name voting-pg \
  -e POSTGRES_USER=voting -e POSTGRES_PASSWORD=voting -e POSTGRES_DB=voting \
  -p 5432:5432 postgres:16-alpine

# set env
cp .env.example .env
# edit .env with: DATABASE_URL="postgresql://voting:voting@localhost:5432/voting"

# push schema
pnpm drizzle-kit push --force

# start dev server
pnpm dev
```

## Deploy (Dokploy)

1. Create a PostgreSQL database service in Dokploy
2. Create a new application pointing at this repo (auto-detects `Dockerfile`)
3. Set `DATABASE_URL` env var using the internal Dokploy network hostname
4. After first deploy, run in the Dokploy terminal:
   ```sh
   npx drizzle-kit push --force
   ```
