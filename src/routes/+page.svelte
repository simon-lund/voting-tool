<script lang="ts">
	import { enhance } from '$app/forms';
	import { Vote } from '@lucide/svelte';

	let { form } = $props();

	let title = $state('');
	let optionsText = $state('');
	let numVoters = $state(3);
	let submitting = $state(false);

	const parsedOptions = $derived(
		optionsText
			.split(/[\n,;]+/)
			.map((s) => s.trim())
			.filter(Boolean)
	);
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<div class="flex items-center gap-3 mb-8">
			<Vote class="h-5 w-5 text-muted-foreground" />
			<h1 class="text-lg font-medium tracking-tight">pairwise vote</h1>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			{#if form?.error}
				<div class="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
					{form.error}
				</div>
			{/if}

			<div class="space-y-1.5">
				<label for="title" class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Title
				</label>
				<input
					id="title"
					name="title"
					type="text"
					bind:value={title}
					placeholder="What should we do this weekend?"
					class="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="options" class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Options — one per line
				</label>
				<textarea
					id="options"
					name="options"
					bind:value={optionsText}
					placeholder={"Hiking\nBeach day\nMuseum\nCooking class\nEscape room"}
					rows="5"
					class="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-y leading-relaxed"
				></textarea>
				{#if parsedOptions.length > 0}
					<div class="flex flex-wrap gap-1.5 mt-2">
						{#each parsedOptions as opt}
							<span class="text-xs px-2 py-0.5 bg-muted border border-border rounded-full text-muted-foreground">
								{opt}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="numVoters" class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					Number of voters
				</label>
				<input
					id="numVoters"
					name="numVoters"
					type="number"
					bind:value={numVoters}
					min="1"
					max="50"
					class="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<button
				type="submit"
				disabled={submitting}
				class="w-full px-4 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
			>
				{submitting ? 'Creating...' : 'Create vote'}
			</button>
		</form>
	</div>
</div>
