<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		children?: Snippet;
		footer?: Snippet;
		size?: 'md' | 'lg';
	};

	let { open = $bindable(false), title, description, children, footer, size = 'md' }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	const titleId = $props.id();

	$effect(() => {
		const el = dialog;
		if (!el) return;
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	});

	function close() {
		open = false;
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) close();
	}}
	aria-labelledby={titleId}
	class={[
		'surface-card m-auto w-[min(100%-2rem,32rem)] p-0 text-ink shadow-[var(--shadow-lg)]',
		size === 'lg' ? 'w-[min(100%-2rem,44rem)]' : '',
		'backdrop:bg-[rgba(28,25,23,0.45)] backdrop:backdrop-blur-[2px]'
	].join(' ')}
>
	<header class="flex items-start justify-between gap-4 border-b border-border-base px-5 py-4">
		<div>
			<h2 id={titleId} class="font-sans text-base font-semibold text-ink">{title}</h2>
			{#if description}
				<p class="mt-0.5 text-sm text-ink-muted">{description}</p>
			{/if}
		</div>
		<button
			type="button"
			class="grid size-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
			onclick={close}
			aria-label="Tutup dialog"
		>
			<Icon name="close" size={16} />
		</button>
	</header>

	{#if children}
		<div class="px-5 py-4">
			{@render children()}
		</div>
	{/if}

	{#if footer}
		<footer class="flex flex-wrap justify-end gap-2 border-t border-border-base px-5 py-3">
			{@render footer()}
		</footer>
	{/if}
</dialog>

<style>
	dialog:not([open]) {
		display: none;
	}
</style>
