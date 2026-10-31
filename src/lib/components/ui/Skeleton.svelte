<script lang="ts">
	type Props = {
		rows?: number;
		class?: string;
	};

	let { rows = 3, class: cls = '' }: Props = $props();
</script>

<div class={['flex flex-col gap-2', cls].join(' ')} aria-hidden="true">
	{#each Array.from({ length: rows }, (_, i) => i) as row (row)}
		<div class="h-10 animate-pulse rounded-md bg-surface-raised opacity-70"></div>
	{/each}
</div>
