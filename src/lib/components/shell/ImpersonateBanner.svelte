<script lang="ts">
	import Icon from '../ui/Icon.svelte';

	type Props = {
		userName: string;
	};

	let { userName }: Props = $props();
	let loading = $state(false);

	async function stopImpersonation() {
		loading = true;
		try {
			const res = await fetch('/api/impersonate/stop', { method: 'POST' });
			if (res.ok) {
				window.location.href = '/users';
			} else {
				const data = await res.json();
				alert(data.message ?? 'Gagal kembali ke akun owner.');
			}
		} finally {
			loading = false;
		}
	}
</script>

<aside
	class="fixed inset-x-0 top-0 z-[100] flex min-h-10 items-center justify-between gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm sm:justify-center sm:gap-3 sm:px-4 sm:text-[13px]"
	role="status"
	aria-live="polite"
>
	<div class="flex min-w-0 items-center gap-1.5 sm:gap-2">
		<span class="grid size-5 shrink-0 place-items-center">
			<Icon name="switchUser" size={14} />
		</span>
		<span class="truncate">
			Melihat sebagai <strong class="font-bold underline decoration-amber-950/30 underline-offset-2">{userName}</strong>
		</span>
	</div>

	<button
		type="button"
		class="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-50 transition-colors hover:bg-amber-900 active:scale-95 disabled:opacity-50"
		onclick={stopImpersonation}
		disabled={loading}
	>
		{loading ? 'Kembali…' : 'Kembali ke Owner'}
	</button>
</aside>
