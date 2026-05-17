<script lang="ts">
	import { ArrowLeft, ArrowUp, Minus } from '@lucide/svelte';

	type Option = { id: number; label: string; position: number };
	type PairVote = { optionAId: number; optionBId: number; winner: string };

	let {
		options,
		votes,
		voterToken,
		readonly = false
	}: {
		options: Option[];
		votes: PairVote[];
		voterToken: string;
		readonly?: boolean;
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
</script>

<div class="overflow-x-auto">
	<table class="border-collapse">
		<thead>
			<tr>
				<th class="p-2"></th>
				{#each sorted as col}
					<th
						class="p-2 text-xs font-medium text-muted-foreground max-w-20 truncate text-center"
						title={col.label}
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sorted as row, ri}
				<tr>
					<td
						class="p-2 text-xs font-medium text-muted-foreground max-w-24 truncate text-right pr-3"
						title={row.label}
					>
						{row.label}
					</td>
					{#each sorted as col, ci}
						{@const isDiag = row.id === col.id}
						{@const isUpper = ri < ci}
						{@const winner = !isDiag ? getWinner(row.id, col.id) : null}
						<td class="p-0">
							{#if isDiag}
								<div
									class="h-10 w-10 flex items-center justify-center bg-muted/50 rounded-md"
								>
									<Minus class="h-3 w-3 text-muted-foreground/30" />
								</div>
							{:else if isUpper}
								<button
									class="h-10 w-10 flex items-center justify-center border border-border rounded-md transition-colors
										{winner === 'row'
										? 'bg-foreground text-background'
										: winner === 'col'
											? 'bg-foreground text-background'
											: 'bg-background hover:bg-muted'}
										{readonly ? 'cursor-default' : 'cursor-pointer'}"
									onclick={() => toggleCell(row.id, col.id)}
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
										<ArrowUp class="h-4 w-4" />
									{/if}
								</button>
							{:else}
								{@const mirrorWinner = getWinner(row.id, col.id)}
								<div
									class="h-10 w-10 flex items-center justify-center rounded-md
										{mirrorWinner !== null ? 'bg-muted' : 'bg-muted/30'}"
									title={mirrorWinner === 'row'
										? `${row.label} preferred`
										: mirrorWinner === 'col'
											? `${col.label} preferred`
											: ''}
								>
									{#if mirrorWinner === 'row'}
										<ArrowLeft class="h-3 w-3 text-muted-foreground" />
									{:else if mirrorWinner === 'col'}
										<ArrowUp class="h-3 w-3 text-muted-foreground" />
									{/if}
								</div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
