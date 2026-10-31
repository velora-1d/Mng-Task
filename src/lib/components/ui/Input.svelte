<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Props = Omit<HTMLInputAttributes, 'children'> & {
		label: string;
		hint?: string;
		error?: string | null | undefined;
		/** Sembunyikan label secara visual, tetap terbaca screen reader. */
		hideLabel?: boolean;
		/** Konten di dalam input, misalnya tombol custom. */
		trailing?: Snippet;
	};

	let {
		label,
		hint,
		error = null,
		hideLabel = false,
		trailing,
		value = $bindable(''),
		class: cls = '',
		id,
		type = 'text',
		...rest
	}: Props = $props();

	let showPassword = $state(false);
	let isPassword = $derived(type === 'password');
	let effectiveType = $derived(isPassword ? (showPassword ? 'text' : 'password') : type);

	const uid = $props.id();
	let inputId = $derived(id ?? `field-${uid}`);
	let hintId = $derived(`${inputId}-hint`);
	let errorId = $derived(`${inputId}-error`);
	let describedBy = $derived(
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')
	);
</script>

<div class="flex flex-col gap-1.5">
	<label for={inputId} class={hideLabel ? 'sr-only' : 'text-[13px] font-semibold text-ink-secondary'}>
		{label}
	</label>

	<div class="relative">
		<input
			id={inputId}
			bind:value
			type={effectiveType}
			class={[
				'input',
				error ? 'border-danger focus:border-danger' : '',
				trailing || isPassword ? 'pr-11' : '',
				cls
			].join(' ')}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy || undefined}
			{...rest}
		/>
		{#if trailing}
			<div class="absolute inset-y-0 right-1 flex items-center">
				{@render trailing()}
			</div>
		{:else if isPassword}
			<div class="absolute inset-y-0 right-1 flex items-center">
				<button
					type="button"
					class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
					onclick={() => (showPassword = !showPassword)}
					aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
					title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
					aria-pressed={showPassword}
					tabindex="-1"
				>
					<Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
				</button>
			</div>
		{/if}
	</div>

	{#if hint && !error}
		<p id={hintId} class="text-xs text-ink-muted">{hint}</p>
	{/if}
	{#if error}
		<p id={errorId} class="text-xs font-medium text-danger" role="alert">{error}</p>
	{/if}
</div>
