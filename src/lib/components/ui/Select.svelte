<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type Option = { value: string; label: string };

	type Props = Omit<HTMLSelectAttributes, 'children'> & {
		label: string;
		hint?: string;
		error?: string | null | undefined;
		options: Option[];
		placeholder?: string;
		hideLabel?: boolean;
	};

	let {
		label,
		hint,
		error = null,
		options,
		placeholder,
		hideLabel = false,
		value = $bindable(''),
		class: cls = '',
		id,
		...rest
	}: Props = $props();

	const uid = $props.id();
	let selectId = $derived(id ?? `field-${uid}`);
	let errorId = $derived(`${selectId}-error`);
</script>

<div class="flex flex-col gap-1.5">
	<label for={selectId} class={hideLabel ? 'sr-only' : 'text-[13px] font-semibold text-ink-secondary'}>
		{label}
	</label>

	<select
		id={selectId}
		bind:value
		class={['input appearance-none pr-8', error ? 'border-danger' : '', cls].join(' ')}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : hint ? `${selectId}-hint` : undefined}
		{...rest}
	>
		{#if placeholder}
			<option value="">{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if hint && !error}
		<p id={`${selectId}-hint`} class="text-xs text-ink-muted">{hint}</p>
	{/if}
	{#if error}
		<p id={errorId} class="text-xs font-medium text-danger" role="alert">{error}</p>
	{/if}
</div>
