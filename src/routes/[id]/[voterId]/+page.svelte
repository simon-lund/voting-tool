<script lang="ts">
	import PairwiseMatrix from '$lib/components/PairwiseMatrix.svelte';
	import { Vote, ArrowLeft, ArrowUp } from '@lucide/svelte';

	let { data } = $props();
</script>

<div class="min-h-screen bg-background">
	<header class="border-b border-border bg-background px-6 py-4 flex items-center gap-3">
		<Vote class="h-4 w-4 text-muted-foreground" />
		<h1 class="text-sm font-medium tracking-tight">{data.vote.title}</h1>
		<span class="text-xs text-muted-foreground ml-auto">{data.voter.name}</span>
	</header>

	<div class="max-w-3xl mx-auto p-6 space-y-6">
		<div>
			<p class="text-sm text-muted-foreground mb-1">
				Compare each pair of options. Click a cell to set your preference.
			</p>
			<div class="flex items-center gap-4 text-xs text-muted-foreground">
				<span class="flex items-center gap-1"><ArrowLeft class="h-3 w-3" /> prefer row</span>
				<span class="flex items-center gap-1"><ArrowUp class="h-3 w-3" /> prefer column</span>
			</div>
		</div>

		<div class="bg-muted/30 border border-border rounded-lg p-4">
			<PairwiseMatrix
				options={data.options}
				votes={data.votes}
				voterToken={data.voter.token}
			/>
		</div>

		<p class="text-xs text-muted-foreground text-center">
			{data.votes.length} / {data.totalPairs} pairs answered
		</p>
	</div>
</div>
