<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		subtitle?: string;
		action?: Snippet;
		children: Snippet;
		/** Padding body; setel false kalau isi card berupa tabel yang menempel ke tepi. */
		padded?: boolean;
		class?: string;
	};

	let { title, subtitle, action, children, padded = true, class: cls = '' }: Props = $props();
</script>

<section class={['surface-card overflow-hidden', cls].join(' ')}>
	{#if title || action}
		<header class="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
			<div class="min-w-0">
				{#if title}
					<h3 class="text-base font-semibold text-ink">{title}</h3>
				{/if}
				{#if subtitle}
					<p class="text-xs text-ink-muted">{subtitle}</p>
				{/if}
			</div>
			{#if action}
				{@render action()}
			{/if}
		</header>
	{/if}

	<div class={padded ? 'px-4 pb-4' : ''}>
		{@render children()}
	</div>
</section>
