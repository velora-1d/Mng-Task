<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Omit<HTMLTextareaAttributes, 'children'> & {
		label: string;
		hint?: string;
		error?: string | null | undefined;
		hideLabel?: boolean;
	};

	let {
		label,
		hint,
		error = null,
		hideLabel = false,
		value = $bindable(''),
		class: cls = '',
		id,
		rows = 4,
		...rest
	}: Props = $props();

	const uid = $props.id();
	let areaId = $derived(id ?? `field-${uid}`);
	let errorId = $derived(`${areaId}-error`);
</script>

<div class="flex flex-col gap-1.5">
	<label for={areaId} class={hideLabel ? 'sr-only' : 'text-[13px] font-semibold text-ink-secondary'}>
		{label}
	</label>

	<textarea
		id={areaId}
		{rows}
		bind:value
		class={['input !h-auto min-h-[160px] py-3 leading-relaxed resize-y', error ? 'border-danger' : '', cls].join(' ')}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : hint ? `${areaId}-hint` : undefined}
		{...rest}
	></textarea>

	{#if hint && !error}
		<p id={`${areaId}-hint`} class="text-xs text-ink-muted">{hint}</p>
	{/if}
	{#if error}
		<p id={errorId} class="text-xs font-medium text-danger" role="alert">{error}</p>
	{/if}
</div>
