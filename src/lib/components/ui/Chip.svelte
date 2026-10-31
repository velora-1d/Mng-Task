<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ChipTone } from '#lib/types';

	type Props = {
		tone?: ChipTone;
		children: Snippet;
		class?: string;
	};

	let { tone = 'neutral', children, class: cls = '' }: Props = $props();

	const TONE_CLASS: Record<ChipTone, string> = {
		todo: 'chip-todo',
		progress: 'chip-progress',
		blocked: 'chip-blocked',
		done: 'chip-done',
		low: 'prio-low',
		medium: 'prio-medium',
		high: 'prio-high',
		urgent: 'prio-urgent',
		neutral: 'text-ink-muted bg-surface-raised',
		success: 'chip-done',
		warning: 'prio-medium',
		danger: 'chip-blocked'
	};
</script>

<span class={['chip', TONE_CLASS[tone], cls].join(' ')}>{@render children()}</span>
