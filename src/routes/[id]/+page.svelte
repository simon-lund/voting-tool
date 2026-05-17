<script lang="ts">
	import PairwiseMatrix from '$lib/components/PairwiseMatrix.svelte';
	import { Copy, Check, Vote, Link, BarChart3, ArrowLeft, ArrowDown } from '@lucide/svelte';

	let { data } = $props();

	let copiedIdx = $state<number | null>(null);

	async function copyLink(link: string, idx: number) {
		await navigator.clipboard.writeText(link);
		copiedIdx = idx;
		setTimeout(() => {
			if (copiedIdx === idx) copiedIdx = null;
		}, 2000);
	}

	type Option = { id: number; label: string; position: number };

	function computeResults(
		opts: Option[],
		allVotes: { voterId: number; optionAId: number; optionBId: number; winner: string }[]
	) {
		const n = opts.length;
		const wins: Record<number, number> = {};
		const losses: Record<number, number> = {};
		for (const o of opts) {
			wins[o.id] = 0;
			losses[o.id] = 0;
		}

		const pairs: [number, number][] = [];
		for (let i = 0; i < n; i++) {
			for (let j = i + 1; j < n; j++) {
				pairs.push([opts[i].id, opts[j].id]);
			}
		}

		for (const [aId, bId] of pairs) {
			let aCount = 0;
			let bCount = 0;
			for (const v of allVotes) {
				if (v.optionAId === aId && v.optionBId === bId) {
					if (v.winner === 'a') aCount++;
					else if (v.winner === 'b') bCount++;
				}
			}
			if (aCount > bCount) {
				wins[aId]++;
				losses[bId]++;
			} else if (bCount > aCount) {
				wins[bId]++;
				losses[aId]++;
			}
		}

		return opts
			.map((o) => ({
				...o,
				score: wins[o.id] - losses[o.id],
				wins: wins[o.id],
				losses: losses[o.id]
			}))
			.sort((a, b) => b.score - a.score);
	}

	const results = $derived(computeResults(data.options, data.allVotes));
	const maxScore = $derived(Math.max(...results.map((r) => r.score), 1));
	const minScore = $derived(Math.min(...results.map((r) => r.score), 0));
	const scoreRange = $derived(maxScore - minScore || 1);

	const totalPairs = $derived(
		(data.options.length * (data.options.length - 1)) / 2
	);
	const totalExpected = $derived(totalPairs * (data.voters.length + 1));
	const totalAnswered = $derived(data.allVotes.length);
</script>

<div class="min-h-screen bg-background">
	<header class="border-b border-border bg-background px-6 py-4 flex items-center gap-3">
		<Vote class="h-4 w-4 text-muted-foreground" />
		<h1 class="text-sm font-medium tracking-tight">{data.vote.title}</h1>
		<span class="text-xs text-muted-foreground ml-auto">admin</span>
	</header>

	<div class="max-w-3xl mx-auto p-6 space-y-8">
		<!-- Links section -->
		<section>
			<div class="flex items-center gap-2 mb-3">
				<Link class="h-3.5 w-3.5 text-muted-foreground" />
				<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Voter links
				</h2>
			</div>
			<div class="space-y-2">
				{#each data.voters as voter, i}
					<div
						class="flex items-center gap-3 px-3 py-2 bg-muted/50 border border-border rounded-lg"
					>
						<span class="text-sm font-medium flex-shrink-0 w-20 truncate">{voter.name}</span>
						<code class="text-xs text-muted-foreground truncate flex-1">{voter.link}</code>
						<button
							onclick={() => copyLink(voter.link, i)}
							class="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
							title="Copy link"
						>
							{#if copiedIdx === i}
								<Check class="h-3.5 w-3.5 text-green-600" />
							{:else}
								<Copy class="h-3.5 w-3.5 text-muted-foreground" />
							{/if}
						</button>
					</div>
				{/each}
			</div>
		</section>

		<!-- Admin voting matrix -->
		{#if data.adminVoter}
			<section>
				<div class="flex items-center gap-2 mb-3">
					<Vote class="h-3.5 w-3.5 text-muted-foreground" />
					<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Your vote
					</h2>
				</div>
				<div class="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
					<span class="flex items-center gap-1"><ArrowLeft class="h-3 w-3" /> prefer row</span>
					<span class="flex items-center gap-1"><ArrowDown class="h-3 w-3" /> prefer column</span>
				</div>
				<div class="bg-muted/30 border border-border rounded-lg p-4">
					<PairwiseMatrix
						options={data.options}
						votes={data.adminVotes}
						voterToken={data.adminVoter.token}
					/>
				</div>
			</section>
		{/if}

		<!-- Results section -->
		<section>
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="h-3.5 w-3.5 text-muted-foreground" />
				<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Results (Copeland)
				</h2>
			</div>

			<div class="grid grid-cols-3 gap-2 mb-4">
				<div class="bg-muted/50 border border-border rounded-lg p-3">
					<span class="text-lg font-medium block">{data.options.length}</span>
					<span class="text-xs text-muted-foreground">options</span>
				</div>
				<div class="bg-muted/50 border border-border rounded-lg p-3">
					<span class="text-lg font-medium block">{data.voters.length + 1}</span>
					<span class="text-xs text-muted-foreground">voters</span>
				</div>
				<div class="bg-muted/50 border border-border rounded-lg p-3">
					<span class="text-lg font-medium block">{totalAnswered}/{totalExpected}</span>
					<span class="text-xs text-muted-foreground">pairs done</span>
				</div>
			</div>

			<div class="space-y-1">
				{#each results as result, rank}
					{@const pct = Math.round(((result.score - minScore) / scoreRange) * 100)}
					<div class="grid grid-cols-[24px_1fr_80px_40px] items-center gap-3 py-2 border-b border-border last:border-0">
						<span class="text-xs text-muted-foreground text-right font-mono">{rank + 1}</span>
						<span class="text-sm font-medium truncate">{result.label}</span>
						<div class="h-1 bg-muted rounded-full overflow-hidden">
							<div class="h-full bg-foreground rounded-full" style="width:{pct}%"></div>
						</div>
						<span class="text-xs text-muted-foreground text-right font-mono">{result.score}</span>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
