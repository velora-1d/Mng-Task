<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = Omit<HTMLButtonAttributes, 'children'> & {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md';
		loading?: boolean;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		children,
		class: cls = '',
		disabled = false,
		type = 'button',
		...rest
	}: Props = $props();

	const VARIANTS = {
		primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-[0_4px_12px_rgba(194,65,12,0.25)]',
		secondary: 'border border-border-base text-ink hover:bg-surface-raised',
		ghost: 'text-ink-secondary hover:bg-surface hover:text-ink',
		danger: 'bg-danger text-white hover:opacity-90'
	} as const;

	const SIZES = {
		sm: 'h-8 px-3 text-[13px]',
		md: 'h-10 px-4 text-sm'
	} as const;

	let classes = $derived(
		[
			'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold whitespace-nowrap',
			'transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed',
			VARIANTS[variant],
			SIZES[size],
			cls
		].join(' ')
	);
</script>

<button {type} class={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
	{#if loading}
		<span
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			aria-hidden="true"
		></span>
	{/if}
	{@render children()}
</button>
