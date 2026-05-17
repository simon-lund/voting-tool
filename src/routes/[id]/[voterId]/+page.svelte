<script lang="ts">
	import PairwiseMatrix from '$lib/components/PairwiseMatrix.svelte';
	import { source } from 'sveltekit-sse';
	import { Vote, ArrowLeft, ArrowDown, BarChart3 } from '@lucide/svelte';

	let { data } = $props();
	let answered = $state(data.votes.length);
	let liveAllVotes = $state(data.allVotes);

	const connection = source('/api/events', {
		options: {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ votePublicId: data.vote.publicId })
		}
	});

	const votesEvent = connection.select('votes');

	$effect(() => {
		const value = votesEvent.json<typeof data.allVotes>();
		if (value && Array.isArray(value)) {
			liveAllVotes = value;
		}
	});

	type Option = { id: number; label: string; position: number };

	function computeRanking(
		opts: Option[],
		votesList: { optionAId: number; optionBId: number; winner: string }[]
	) {
		const wins: Record<number, number> = {};
		const losses: Record<number, number> = {};
		for (const o of opts) {
			wins[o.id] = 0;
			losses[o.id] = 0;
		}

		const pairs: [number, number][] = [];
		for (let i = 0; i < opts.length; i++) {
			for (let j = i + 1; j < opts.length; j++) {
				pairs.push([opts[i].id, opts[j].id]);
			}
		}

		for (const [aId, bId] of pairs) {
			let aCount = 0;
			let bCount = 0;
			for (const v of votesList) {
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
				score: wins[o.id] - losses[o.id]
			}))
			.sort((a, b) => b.score - a.score);
	}

	const myRanking = $derived(computeRanking(data.options, data.votes));
	const totalRanking = $derived(computeRanking(data.options, liveAllVotes));

	let showAllMy = $state(false);
	let showAllTotal = $state(false);

	const visibleMy = $derived(
		myRanking.length > 15 && !showAllMy ? myRanking.slice(0, 12) : myRanking
	);
	const visibleTotal = $derived(
		totalRanking.length > 15 && !showAllTotal ? totalRanking.slice(0, 12) : totalRanking
	);
</script>

<div class="min-h-screen bg-background">
	<header class="border-b border-border bg-background px-6 py-4 flex items-center gap-3">
		<Vote class="h-4 w-4 text-muted-foreground" />
		<h1 class="text-sm font-medium tracking-tight">{data.vote.title}</h1>
		<span class="text-xs text-muted-foreground ml-auto">{data.voter.name}</span>
	</header>

	<div class="px-6 py-6 space-y-6">
		<div class="max-w-3xl mx-auto">
			<p class="text-sm text-muted-foreground mb-1">
				Compare each pair of options. Click a cell to set your preference.
			</p>
			<div class="flex items-center gap-4 text-xs text-muted-foreground">
				<span class="flex items-center gap-1"><ArrowLeft class="h-3 w-3" /> prefer row</span>
				<span class="flex items-center gap-1"><ArrowDown class="h-3 w-3" /> prefer column</span>
			</div>
		</div>

		<div class="bg-muted/30 border border-border rounded-lg p-4 w-fit mx-auto max-w-full">
			<PairwiseMatrix
				options={data.options}
				votes={data.votes}
				voterToken={data.voter.token}
				bind:answered
			/>
		</div>

		<p class="text-xs text-muted-foreground text-center">
			{answered} / {data.totalPairs} pairs answered
		</p>

		<!-- Rankings -->
		<div class="space-y-6 max-w-xl mx-auto">
			<!-- Your ranking -->
			<section class="bg-muted/30 border border-border rounded-lg p-4">
				<div class="flex items-center gap-2 mb-3">
					<BarChart3 class="h-3.5 w-3.5 text-muted-foreground" />
					<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Your ranking
					</h2>
				</div>
				<div class="space-y-1">
					{#each visibleMy as result, rank}
						<div class="flex items-center gap-3 py-1.5">
							<span class="text-xs text-muted-foreground font-mono w-4 text-right">{rank + 1}</span>
							<span class="text-sm truncate">{result.label}</span>
							<span class="text-xs text-muted-foreground font-mono ml-auto">{result.score}</span>
						</div>
					{/each}
				</div>
				{#if myRanking.length > 15 && !showAllMy}
					<button
						onclick={() => showAllMy = true}
						class="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						show {myRanking.length - 12} more...
					</button>
				{/if}
			</section>

			<!-- Total ranking -->
			<section class="bg-muted/30 border border-border rounded-lg p-4">
				<div class="flex items-center gap-2 mb-3">
					<BarChart3 class="h-3.5 w-3.5 text-muted-foreground" />
					<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Group ranking
					</h2>
				</div>
				<div class="space-y-1">
					{#each visibleTotal as result, rank}
						<div class="flex items-center gap-3 py-1.5">
							<span class="text-xs text-muted-foreground font-mono w-4 text-right">{rank + 1}</span>
							<span class="text-sm truncate">{result.label}</span>
							<span class="text-xs text-muted-foreground font-mono ml-auto">{result.score}</span>
						</div>
					{/each}
				</div>
				{#if totalRanking.length > 15 && !showAllTotal}
					<button
						onclick={() => showAllTotal = true}
						class="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						show {totalRanking.length - 12} more...
					</button>
				{/if}
			</section>
		</div>

		<div class="h-24"></div>
	</div>
</div>
