<script lang="ts">
	import PairwiseMatrix from '$lib/components/PairwiseMatrix.svelte';
	import { Copy, Check, Vote, Link, BarChart3, ArrowLeft, ArrowDown, Plus, Trash2 } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let localOptions = $state(data.options);
	let localVoters = $state(data.voters);
	let copiedIdx = $state<number | null>(null);
	let copiedAll = $state(false);
	let newOption = $state('');
	let addingOption = $state(false);
	let newVoterName = $state('');
	let addingVoter = $state(false);
	let deleteConfirm = $state('');
	let deleting = $state(false);
	let activeTab = $state<'vote' | 'results'>('vote');

	async function copyLink(link: string, idx: number) {
		await navigator.clipboard.writeText(link);
		copiedIdx = idx;
		setTimeout(() => {
			if (copiedIdx === idx) copiedIdx = null;
		}, 2000);
	}

	async function copyAllLinks() {
		const text = localVoters.map((v) => `- [${v.name}](${v.link})`).join('\n');
		await navigator.clipboard.writeText(text);
		copiedAll = true;
		setTimeout(() => { copiedAll = false; }, 2000);
	}

	async function addOption() {
		if (!newOption.trim() || addingOption) return;
		addingOption = true;
		const res = await fetch('/api/options', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ adminId: data.vote.adminId, label: newOption.trim() })
		});
		if (res.ok) {
			const { option } = await res.json();
			localOptions = [...localOptions, option];
			newOption = '';
		}
		addingOption = false;
	}

	async function removeOption(optionId: number) {
		const res = await fetch('/api/options', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ adminId: data.vote.adminId, optionId })
		});
		if (res.ok) {
			localOptions = localOptions.filter((o) => o.id !== optionId);
		}
	}

	async function addVoter() {
		if (!newVoterName.trim() || addingVoter) return;
		addingVoter = true;
		const res = await fetch('/api/voters', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ adminId: data.vote.adminId, name: newVoterName.trim() })
		});
		if (res.ok) {
			const { voter } = await res.json();
			localVoters = [...localVoters, voter];
			newVoterName = '';
		}
		addingVoter = false;
	}

	async function deleteVote() {
		if (deleteConfirm !== data.vote.title || deleting) return;
		deleting = true;
		const res = await fetch('/api/delete-vote', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ adminId: data.vote.adminId, confirmTitle: deleteConfirm })
		});
		if (res.ok) {
			goto('/');
		}
		deleting = false;
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

	const results = $derived(computeResults(localOptions, data.allVotes));
	const maxScore = $derived(Math.max(...results.map((r) => r.score), 1));
	const minScore = $derived(Math.min(...results.map((r) => r.score), 0));
	const scoreRange = $derived(maxScore - minScore || 1);

	const totalPairs = $derived(
		(localOptions.length * (localOptions.length - 1)) / 2
	);
	const totalExpected = $derived(totalPairs * (localVoters.length + 1));
	const totalAnswered = $derived(data.allVotes.length);
</script>

<div class="min-h-screen bg-background">
	<header class="border-b border-border bg-background px-6 py-4 flex items-center gap-3">
		<Vote class="h-4 w-4 text-muted-foreground" />
		<h1 class="text-sm font-medium tracking-tight">{data.vote.title}</h1>
		<span class="text-xs text-muted-foreground ml-auto">admin</span>
	</header>

	<div class="max-w-6xl mx-auto p-6 space-y-8">
		<!-- Options section -->
		<section>
			<div class="flex items-center gap-2 mb-3">
				<Vote class="h-3.5 w-3.5 text-muted-foreground" />
				<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Options
				</h2>
			</div>
			<div class="flex flex-wrap gap-1.5 mb-3">
				{#each localOptions as opt}
					<span class="group text-xs px-2 py-1 bg-muted border border-border rounded-full text-foreground inline-flex items-center gap-1">
						{opt.label}
						<button
							onclick={() => removeOption(opt.id)}
							class="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
							title="Remove"
						>×</button>
					</span>
				{/each}
			</div>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newOption}
					placeholder="Add option..."
					onkeydown={(e) => { if (e.key === 'Enter') addOption(); }}
					class="flex-1 px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<button
					onclick={addOption}
					disabled={addingOption || !newOption.trim()}
					class="px-3 py-1.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
				>
					<Plus class="h-3.5 w-3.5" />
					Add
				</button>
			</div>
		</section>

		<!-- Links section -->
		<section>
			<div class="flex items-center gap-2 mb-3">
				<Link class="h-3.5 w-3.5 text-muted-foreground" />
				<h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Voter links
				</h2>
				<button
					onclick={copyAllLinks}
					class="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
				>
					{#if copiedAll}
						<Check class="h-3 w-3 text-green-600" />
						<span class="text-green-600">copied</span>
					{:else}
						<Copy class="h-3 w-3" />
						copy all
					{/if}
				</button>
			</div>
			<div class="space-y-2">
				{#each localVoters as voter, i}
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
			<div class="flex gap-2 mt-3">
				<input
					type="text"
					bind:value={newVoterName}
					placeholder="Add voter..."
					onkeydown={(e) => { if (e.key === 'Enter') addVoter(); }}
					class="flex-1 px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<button
					onclick={addVoter}
					disabled={addingVoter || !newVoterName.trim()}
					class="px-3 py-1.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
				>
					<Plus class="h-3.5 w-3.5" />
					Add
				</button>
			</div>
		</section>

		<!-- Tabs -->
		<div class="flex gap-1 border-b border-border">
			<button
				onclick={() => activeTab = 'vote'}
				class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
					{activeTab === 'vote' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Vote
			</button>
			<button
				onclick={() => activeTab = 'results'}
				class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
					{activeTab === 'results' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Results
			</button>
		</div>

		<!-- Vote tab -->
		{#if activeTab === 'vote'}
			{#if data.adminVoter}
				<section>
					<div class="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
						<span class="flex items-center gap-1"><ArrowLeft class="h-3 w-3" /> prefer row</span>
						<span class="flex items-center gap-1"><ArrowDown class="h-3 w-3" /> prefer column</span>
					</div>
					<div class="bg-muted/30 border border-border rounded-lg p-4">
						<PairwiseMatrix
							options={localOptions}
							votes={data.adminVotes}
							voterToken={data.adminVoter.token}
						/>
					</div>
				</section>
			{/if}
		{/if}

		<!-- Results tab -->
		{#if activeTab === 'results'}
			<section>
				<div class="grid grid-cols-3 gap-2 mb-4">
					<div class="bg-muted/50 border border-border rounded-lg p-3">
						<span class="text-lg font-medium block">{localOptions.length}</span>
						<span class="text-xs text-muted-foreground">options</span>
					</div>
					<div class="bg-muted/50 border border-border rounded-lg p-3">
						<span class="text-lg font-medium block">{localVoters.length + 1}</span>
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
		{/if}

		<!-- Danger zone -->
		<section class="border border-destructive/30 rounded-lg p-4 mt-12">
			<div class="flex items-center gap-2 mb-3">
				<Trash2 class="h-3.5 w-3.5 text-destructive" />
				<h2 class="text-xs font-medium text-destructive uppercase tracking-wider">
					Danger zone
				</h2>
			</div>
			<p class="text-sm text-muted-foreground mb-3">
				Type <strong class="text-foreground">{data.vote.title}</strong> to permanently delete this vote and all data.
			</p>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={deleteConfirm}
					placeholder="Type vote title to confirm..."
					class="flex-1 px-3 py-1.5 text-sm bg-muted/50 border border-destructive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive/50"
				/>
				<button
					onclick={deleteVote}
					disabled={deleteConfirm !== data.vote.title || deleting}
					class="px-3 py-1.5 text-sm font-medium bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
				>
					{deleting ? 'Deleting...' : 'Delete vote'}
				</button>
			</div>
		</section>
	</div>
</div>
