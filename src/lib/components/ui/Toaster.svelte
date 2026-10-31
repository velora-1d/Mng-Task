<script lang="ts">
	import Icon from './Icon.svelte';
	import { toast, type ToastTone } from './toast.svelte';

	const TONE: Record<ToastTone, { icon: 'check' | 'alert' | 'info'; class: string }> = {
		success: { icon: 'check', class: 'text-success' },
		error: { icon: 'alert', class: 'text-danger' },
		info: { icon: 'info', class: 'text-primary' }
	};
</script>

<div
	class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
	aria-live="polite"
	aria-atomic="false"
>
	{#each toast.items as item (item.id)}
		{@const tone = TONE[item.tone]}
		<div
			class="surface-card pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 shadow-[var(--shadow-md)]"
			role="status"
		>
			<span class={['mt-0.5 shrink-0', tone.class].join(' ')}>
				<Icon name={tone.icon} size={16} />
			</span>
			<p class="flex-1 text-sm text-ink">{item.message}</p>
			<button
				type="button"
				class="text-ink-muted hover:text-ink"
				onclick={() => toast.dismiss(item.id)}
				aria-label="Tutup notifikasi"
			>
				<Icon name="close" size={14} />
			</button>
		</div>
	{/each}
</div>
