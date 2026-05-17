<script lang="ts">
	import { ArrowLeft, ArrowDown, Minus } from '@lucide/svelte';

	type Option = { id: number; label: string; position: number };
	type PairVote = { optionAId: number; optionBId: number; winner: string };

	let {
		options,
		votes,
		voterToken,
		readonly = false,
		answered = $bindable(0)
	}: {
		options: Option[];
		votes: PairVote[];
		voterToken: string;
		readonly?: boolean;
		answered?: number;
	} = $props();

	let localVotes = $state<Map<string, string>>(new Map());

	$effect(() => {
		const m = new Map<string, string>();
		for (const v of votes) {
			const key = `${v.optionAId},${v.optionBId}`;
			m.set(key, v.winner);
		}
		localVotes = m;
	});

	function pairKey(a: number, b: number): string {
		return a < b ? `${a},${b}` : `${b},${a}`;
	}

	function getWinner(rowId: number, colId: number): 'row' | 'col' | null {
		const [lowId, highId] = rowId < colId ? [rowId, colId] : [colId, rowId];
		const key = `${lowId},${highId}`;
		const w = localVotes.get(key);
		if (!w) return null;
		if (rowId < colId) {
			return w === 'a' ? 'row' : 'col';
		} else {
			return w === 'a' ? 'col' : 'row';
		}
	}

	async function toggleCell(rowId: number, colId: number) {
		if (readonly) return;
		const current = getWinner(rowId, colId);
		let next: 'row' | 'col' | null;
		if (current === null) next = 'row';
		else if (current === 'row') next = 'col';
		else next = null;

		const [lowId, highId] = rowId < colId ? [rowId, colId] : [colId, rowId];
		const key = `${lowId},${highId}`;

		let apiWinner: string | null;
		if (next === null) {
			apiWinner = null;
		} else if (next === 'row') {
			apiWinner = rowId < colId ? 'a' : 'b';
		} else {
			apiWinner = colId < rowId ? 'a' : 'b';
		}

		if (apiWinner === null) {
			localVotes.delete(key);
			localVotes = new Map(localVotes);
		} else {
			const normalizedWinner = rowId < colId ? (next === 'row' ? 'a' : 'b') : (next === 'row' ? 'b' : 'a');
			localVotes.set(key, normalizedWinner);
			localVotes = new Map(localVotes);
		}

		await fetch('/api/vote', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				voterToken,
				optionAId: rowId,
				optionBId: colId,
				winner: apiWinner
			})
		});
	}

	const sorted = $derived([...options].sort((a, b) => a.position - b.position));

	let hoverRow = $state<number | null>(null);
	let hoverCol = $state<number | null>(null);

	$effect(() => {
		answered = localVotes.size;
	});
</script>

<div class="overflow-x-auto pb-20">
	<table class="border-collapse">
		<thead>
			<tr>
				<th class="p-2"></th>
				{#each sorted as col}
					<th class="p-0 h-10 w-10"></th>
				{/each}
			</tr>
		</thead>
		<tbody onmouseleave={() => { hoverRow = null; hoverCol = null; }}>
			{#each sorted as row, ri}
				<tr>
					<td
						class="p-2 text-xs font-medium max-w-24 truncate text-right pr-3 transition-colors
							{hoverRow === ri ? 'text-foreground' : 'text-muted-foreground'}"
						title={row.label}
					>
						{row.label}
					</td>
					{#each sorted as col, ci}
						{@const isDiag = row.id === col.id}
						{@const isLower = ri > ci}
						{@const winner = !isDiag ? getWinner(row.id, col.id) : null}
						{@const isHighlighted = hoverRow === ri || hoverCol === ci}
						<td class="p-0">
							{#if isDiag}
								<div
									class="h-10 w-10 flex items-center justify-center bg-muted/50 rounded-md"
								>
									<Minus class="h-3 w-3 text-muted-foreground/30" />
								</div>
							{:else if isLower}
								<button
									class="h-10 w-10 flex items-center justify-center border rounded-md transition-colors
										{winner !== null
										? 'bg-foreground text-background border-foreground'
										: isHighlighted
											? 'bg-muted/80 border-border'
											: 'bg-background border-border hover:bg-muted'}
										{readonly ? 'cursor-default' : 'cursor-pointer'}"
									onclick={() => toggleCell(row.id, col.id)}
									onmouseenter={() => { hoverRow = ri; hoverCol = ci; }}
									disabled={readonly}
									title={winner === 'row'
										? `${row.label} preferred`
										: winner === 'col'
											? `${col.label} preferred`
											: `${row.label} vs ${col.label}`}
								>
									{#if winner === 'row'}
										<ArrowLeft class="h-4 w-4" />
									{:else if winner === 'col'}
										<ArrowDown class="h-4 w-4" />
									{/if}
								</button>
							{:else}
								<div class="h-10 w-10"></div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<td class="p-2"></td>
				{#each sorted as col, ci}
					<td class="p-0 h-0 w-10 relative">
						<span
							class="absolute top-1 left-1/2 origin-top-left rotate-45 text-xs font-medium whitespace-nowrap transition-colors
								{hoverCol === ci ? 'text-foreground' : 'text-muted-foreground'}"
							title={col.label}
						>
							{col.label}
						</span>
					</td>
				{/each}
			</tr>
		</tfoot>
	</table>
</div>
