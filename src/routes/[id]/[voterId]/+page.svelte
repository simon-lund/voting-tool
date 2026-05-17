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

	const votesStore = connection.select('votes');

	$effect(() => {
		const unsub = votesStore.subscribe((raw) => {
			if (raw) {
				try {
					const parsed = JSON.parse(raw);
					if (Array.isArray(parsed)) {
						liveAllVotes = parsed;
					}
				} catch {}
			}
		});
		return unsub;
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

	let showingGroup = $state(true);
	let showAll = $state(false);

	const primaryRanking = $derived(showingGroup ? totalRanking : myRanking);
	const secondaryRanking = $derived(showingGroup ? myRanking : totalRanking);

	const secondaryRankMap = $derived(
		new Map(secondaryRanking.map((r, i) => [r.id, i + 1]))
	);

	const visibleRanking = $derived(
		primaryRanking.length > 15 && !showAll ? primaryRanking.slice(0, 12) : primaryRanking
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

		<div class="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
			<div class="bg-muted/30 border-y border-border p-4 w-fit min-w-full overflow-x-auto md:[border:1px_solid_var(--border)] md:rounded-lg md:w-fit md:min-w-0 md:mx-4">
				<PairwiseMatrix
					options={data.options}
					votes={data.votes}
					voterToken={data.voter.token}
					bind:answered
				/>
			</div>
		</div>

		<p class="text-xs text-muted-foreground text-center">
			{answered} / {data.totalPairs} pairs answered
		</p>

		<!-- Ranking -->
		<div class="max-w-xl mx-auto">
			<section class="bg-muted/30 border border-border rounded-lg p-4">
				<div class="flex items-center gap-2 mb-3">
					<BarChart3 class="h-3.5 w-3.5 text-muted-foreground" />
					<div class="flex gap-1 text-xs font-medium">
						<button
							onclick={() => { showingGroup = true; showAll = false; }}
							class="px-2 py-0.5 rounded transition-colors {showingGroup ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}"
						>
							Group
						</button>
						<button
							onclick={() => { showingGroup = false; showAll = false; }}
							class="px-2 py-0.5 rounded transition-colors {!showingGroup ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}"
						>
							Yours
						</button>
					</div>
				</div>
				<div class="space-y-1">
					{#each visibleRanking as result, rank}
						{@const secondaryRank = secondaryRankMap.get(result.id) ?? 0}
						{@const diff = secondaryRank - (rank + 1)}
						<div class="flex items-center gap-3 py-1.5">
							<span class="text-xs text-muted-foreground font-mono w-4 text-right">{rank + 1}</span>
							<span class="text-sm truncate flex-1">{result.label}</span>
							<span class="text-xs font-mono w-12 text-right {diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}">
								{#if diff > 0}
									+{diff}
								{:else if diff < 0}
									{diff}
								{:else}
									=
								{/if}
							</span>
							<span class="text-xs text-muted-foreground font-mono w-6 text-right" title="{showingGroup ? 'Your' : 'Group'} rank">
								#{secondaryRank}
							</span>
						</div>
					{/each}
				</div>
				{#if primaryRanking.length > 15 && !showAll}
					<button
						onclick={() => showAll = true}
						class="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						show {primaryRanking.length - 12} more...
					</button>
				{/if}
			</section>
		</div>

		<div class="h-24"></div>
	</div>
</div>
