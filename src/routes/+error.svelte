<script lang="ts">
	import { page } from '$app/state';
	import Button from '#lib/components/ui/Button.svelte';

	let status = $derived(page.status);
	let title = $derived(
		status === 404
			? 'Halaman tidak ditemukan'
			: status === 403
				? 'Akses ditolak'
				: status === 401
					? 'Sesi berakhir'
					: 'Terjadi kesalahan'
	);
	let description = $derived(
		status === 404
			? 'Alamat yang kamu buka tidak ada atau sudah dipindahkan.'
			: status === 403
				? 'Akun kamu tidak punya izin untuk membuka halaman ini.'
				: status === 401
					? 'Silakan masuk kembali untuk melanjutkan.'
					: 'Ada masalah di server. Coba lagi beberapa saat lagi.'
	);
</script>

<svelte:head>
	<title>{title} — Mng-Task</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-5 py-10">
	<div class="w-full max-w-md text-center">
		<p class="font-[family-name:var(--font-display)] text-[64px] leading-none font-bold text-primary">
			{status}
		</p>
		<h1 class="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">{title}</h1>
		<p class="mt-2 text-sm text-ink-secondary">{description}</p>

		{#if page.error?.message && status >= 500}
			<p class="mt-4 rounded-lg border border-border-base bg-surface px-3 py-2 font-mono text-xs text-ink-muted">
				{page.error.message}
			</p>
		{/if}

		<div class="mt-6 flex justify-center gap-2">
			<a href="/dashboard" class="btn btn-secondary">Ke dashboard</a>
			<Button variant="primary" onclick={() => history.back()}>Kembali</Button>
		</div>
	</div>
</div>
