<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		page: number;
		totalPages: number;
		hrefFor: (page: number) => string;
		total?: number;
		class?: string;
	};

	let { page, totalPages, hrefFor, total, class: cls = '' }: Props = $props();
</script>

{#if totalPages > 1}
	<nav
		class={['flex flex-wrap items-center justify-between gap-3 border-t border-border-base px-4 py-3', cls].join(
			' '
		)}
		aria-label="Navigasi halaman"
	>
		<p class="text-xs text-ink-muted">
			Halaman {page} dari {totalPages}{#if total !== undefined}&nbsp;· {total} data{/if}
		</p>

		<div class="flex items-center gap-1">
			<a
				href={hrefFor(Math.max(1, page - 1))}
				class={[
					'grid size-8 place-items-center rounded-md border border-border-base text-ink-secondary',
					page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
				].join(' ')}
				aria-label="Halaman sebelumnya"
				aria-disabled={page <= 1}
			>
				<Icon name="chevronLeft" size={15} />
			</a>

			{#each Array.from({ length: totalPages }, (_, i) => i + 1) as n (n)}
				{#if n === 1 || n === totalPages || Math.abs(n - page) <= 1}
					<a
						href={hrefFor(n)}
						class={[
							'grid h-8 min-w-8 place-items-center rounded-md border px-2 text-xs font-semibold',
							n === page
								? 'border-primary bg-primary text-white'
								: 'border-border-base text-ink-secondary hover:bg-surface-raised'
						].join(' ')}
						aria-current={n === page ? 'page' : undefined}
					>
						{n}
					</a>
				{:else if Math.abs(n - page) === 2}
					<span class="px-1 text-xs text-ink-muted">…</span>
				{/if}
			{/each}

			<a
				href={hrefFor(Math.min(totalPages, page + 1))}
				class={[
					'grid size-8 place-items-center rounded-md border border-border-base text-ink-secondary',
					page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-surface-raised'
				].join(' ')}
				aria-label="Halaman berikutnya"
				aria-disabled={page >= totalPages}
			>
				<Icon name="chevronRight" size={15} />
			</a>
		</div>
	</nav>
{/if}
