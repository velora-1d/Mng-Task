<script lang="ts">
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'warning' | 'primary';
		loading?: boolean;
		onconfirm: () => void | Promise<void>;
		oncancel?: () => void;
	};

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Ya, lanjutkan',
		cancelLabel = 'Batal',
		variant = 'danger',
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleCancel() {
		open = false;
		oncancel?.();
	}
</script>

<Dialog bind:open {title} size="md">
	<div class="flex items-start gap-3.5 pt-1">
		<div
			class={[
				'grid size-10 shrink-0 place-items-center rounded-xl',
				variant === 'danger'
					? 'bg-[var(--error-soft)] text-danger'
					: variant === 'warning'
						? 'bg-[var(--warning-soft)] text-warning'
						: 'bg-primary-soft text-primary'
			].join(' ')}
		>
			<Icon name={variant === 'danger' ? 'trash' : 'alert'} size={20} />
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-sm leading-relaxed text-ink-secondary">{message}</p>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={handleCancel} disabled={loading}>
			{cancelLabel}
		</Button>
		<Button
			variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
			size="sm"
			{loading}
			onclick={onconfirm}
		>
			{confirmLabel}
		</Button>
	{/snippet}
</Dialog>
