<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { form, data }: PageProps = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let serverError = $state<string | null>(null);

	// Isi ulang email setelah validasi gagal supaya pengguna tidak mengetik ulang.
	$effect(() => {
		if (form?.email) email = form.email;
	});

	let error = $derived(serverError ?? form?.error ?? null);

	function onSubmit() {
		submitting = true;
		serverError = null;
		return async ({ result }: { result: any }) => {
			submitting = false;
			if (result.type === 'failure') {
				serverError = result.data?.error ?? 'Login gagal. Coba lagi.';
			}
			await applyAction(result);
		};
	}
</script>

<svelte:head>
	<title>Masuk — Mng-Task</title>
</svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
	<!-- Panel brand -->
	<div
		class="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex"
		style:background-image="linear-gradient(150deg, #9a3412 0%, #c2410c 45%, #b45309 100%)"
	>
		<div class="flex items-center gap-2.5">
			<span
				class="grid size-9 place-items-center rounded-[10px] bg-white/15 font-[family-name:var(--font-display)] text-lg font-bold backdrop-blur"
			>
				M
			</span>
			<span class="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.02em]">
				Mng-Task
			</span>
		</div>

		<div class="max-w-md">
			<p class="text-[11px] font-bold tracking-[0.14em] uppercase opacity-70">Manajemen tugas</p>
			<h1 class="mt-3 font-[family-name:var(--font-display)] text-[40px] leading-[1.12] font-bold">
				Kerja tim rapi, tanpa rapat tambahan.
			</h1>
			<p class="mt-4 max-w-sm text-[15px] leading-relaxed opacity-85">
				Buat tugas, tetapkan penanggung jawab, dan lihat progresnya dalam satu layar. Pengingat
				datang sebelum tenggat — bukan sesudahnya.
			</p>
		</div>

		<p class="text-xs opacity-70">Waktu lokal Asia/Jakarta · v0.1</p>
	</div>

	<!-- Form -->
	<div class="flex items-center justify-center px-5 py-10 sm:px-8">
		<div class="w-full max-w-[380px]">
			<div class="mb-7 flex items-center gap-2.5 lg:hidden">
				<span
					class="grid size-9 place-items-center rounded-[10px] bg-primary font-[family-name:var(--font-display)] text-lg font-bold text-white"
				>
					M
				</span>
				<span class="font-[family-name:var(--font-display)] text-xl font-bold text-ink">Mng-Task</span>
			</div>

			<h2 class="font-[family-name:var(--font-display)] text-[28px] font-bold text-ink">Masuk</h2>
			<p class="mt-1 mb-6 text-sm text-ink-secondary">
				Gunakan akun yang diberikan Owner. Tidak ada pendaftaran publik.
			</p>

			{#if error}
				<div
					class="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-[var(--error-soft)] px-3 py-2.5 text-[13px] text-danger"
					role="alert"
				>
					<Icon name="alert" size={16} class="mt-0.5 shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={onSubmit}
				class="flex flex-col gap-4"
				aria-busy={submitting}
				novalidate
			>
				<input type="hidden" name="next" value={data.next} />

				<Input
					label="Username / Email"
					name="email"
					type="text"
					autocomplete="username"
					required
					bind:value={email}
					placeholder="admin atau user"
				/>

				<Input
					label="Kata sandi"
					name="password"
					type={showPassword ? 'text' : 'password'}
					autocomplete="current-password"
					required
					bind:value={password}
					placeholder="••••••••"
				>
					{#snippet trailing()}
						<button
							type="button"
							class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
							aria-pressed={showPassword}
						>
							<Icon name={showPassword ? 'moon' : 'sun'} size={16} />
						</button>
					{/snippet}
				</Input>

				<Button type="submit" loading={submitting} class="mt-1 w-full">
					{submitting ? 'Memeriksa…' : 'Masuk'}
				</Button>
			</form>
		</div>
	</div>
</div>
