<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { IconName } from '../icons/icons';

	type Props = {
		icon?: IconName;
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	};

	let { icon = 'inbox', title, description, action, class: cls = '' }: Props = $props();
</script>

<div class={['flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', cls].join(' ')}>
	<span class="grid size-12 place-items-center rounded-full bg-surface-raised text-ink-muted">
		<Icon name={icon} size={22} />
	</span>
	<div class="max-w-sm">
		<p class="font-semibold text-ink">{title}</p>
		{#if description}
			<p class="mt-1 text-sm text-ink-muted">{description}</p>
		{/if}
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
