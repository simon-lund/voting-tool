<script lang="ts">
	import { enhance } from '$app/forms';
	import { Vote } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();

	let title = $state('');
	let optionsText = $state('');
	let voterNames = $state('');
	let submitting = $state(false);

	const parsedOptions = $derived(
		optionsText
			.split(/[\n,;]+/)
			.map((s) => s.trim())
			.filter(Boolean)
	);

	const parsedNames = $derived(
		voterNames
			.split(/\n/)
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
				<Label for="title">Title</Label>
				<Input
					id="title"
					name="title"
					type="text"
					bind:value={title}
					placeholder="What should we do this weekend?"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="options">Options — one per line</Label>
				<Textarea
					id="options"
					name="options"
					bind:value={optionsText}
					placeholder={"Hiking\nBeach day\nMuseum\nCooking class\nEscape room"}
					rows={5}
				/>
				{#if parsedOptions.length > 0}
					<div class="flex flex-wrap gap-1.5 mt-2">
						{#each parsedOptions as opt}
							<Badge variant="secondary">{opt}</Badge>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label for="voterNames">Voters — one name per line</Label>
				<Textarea
					id="voterNames"
					name="voterNames"
					bind:value={voterNames}
					placeholder={"Alice\nBob\nCharlie"}
					rows={3}
				/>
				{#if parsedNames.length > 0}
					<p class="text-xs text-muted-foreground">{parsedNames.length} voter{parsedNames.length !== 1 ? 's' : ''}</p>
				{/if}
			</div>

			<Button type="submit" disabled={submitting} class="w-full">
				{submitting ? 'Creating...' : 'Create vote'}
			</Button>
		</form>
	</div>
</div>
