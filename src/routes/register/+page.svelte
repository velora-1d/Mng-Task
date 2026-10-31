<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let serverError = $state<string | null>(null);
	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('mngtask-theme', theme);
		} catch {
			/* localStorage aman */
		}
	}

	$effect(() => {
		if (form?.name) name = form.name;
		if (form?.email) email = form.email;
	});

	let error = $derived(serverError ?? form?.error ?? null);

	function onSubmit() {
		submitting = true;
		serverError = null;
		return async ({ result }: { result: any }) => {
			submitting = false;
			if (result.type === 'failure') {
				serverError = result.data?.error ?? 'Registrasi gagal. Silakan periksa kembali data Anda.';
			}
			await applyAction(result);
		};
	}
</script>

<svelte:head>
	<title>Daftar Akun — Mng-Task</title>
</svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
	<!-- Panel Brand & Showcase (Desktop) -->
	<div
		class="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#7c2d12] p-10 text-white lg:flex xl:p-14"
	>
		<!-- Ambient Glow & Pattern Grid -->
		<div class="absolute inset-0 bg-[radial-gradient(rgba(234,88,12,0.12)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
		<div class="absolute -top-32 -right-32 size-[420px] rounded-full bg-primary/25 blur-3xl pointer-events-none"></div>
		<div class="absolute -bottom-32 -left-32 size-[420px] rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>

		<!-- Header Brand -->
		<div class="relative z-10 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span
					class="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-orange-600 font-[family-name:var(--font-display)] text-xl font-bold text-white shadow-lg shadow-primary/30"
				>
					M
				</span>
				<div>
					<span class="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white block">
						Mng-Task
					</span>
					<span class="text-[10px] font-semibold tracking-wider text-orange-200/70 uppercase">
						Workspace Suite
					</span>
				</div>
			</div>

			<span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-stone-200 backdrop-blur-md shadow-xs">
				<span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
				Registrasi Terbuka
			</span>
		</div>

		<!-- Hero Copy & Live Product Showcase Mockup -->
		<div class="relative z-10 my-auto py-6">
			<div class="max-w-md">
				<span class="inline-block rounded-lg bg-primary/20 border border-primary/30 px-3 py-1 text-[11px] font-bold tracking-wider text-orange-300 uppercase shadow-2xs">
					🚀 Kolaborasi Tanpa Batas
				</span>
				<h1 class="mt-4 font-[family-name:var(--font-display)] text-3xl xl:text-4xl leading-[1.18] font-bold text-white">
					Bergabung & kelola tugas bersama tim Anda.
				</h1>
				<p class="mt-3 text-[14px] leading-relaxed text-stone-300">
					Daftarkan akun anggota baru untuk mulai membagikan tugas, menyinkronkan kalender, dan menyelesaikan target bersama.
				</p>
			</div>

			<!-- Interactive Glass Task Card Mockup -->
			<div class="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
				<div class="flex items-center justify-between gap-2">
					<span class="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
						<span class="size-1.5 rounded-full bg-emerald-400"></span>
						Akun Baru Siap Pakai
					</span>
					<span class="text-[11px] font-bold text-orange-300">Akses Tim</span>
				</div>

				<h3 class="mt-3 font-[family-name:var(--font-display)] text-base font-bold text-white">
					Onboarding Cepat & Penugasan Otomatis
				</h3>

				<div class="mt-3 flex items-center justify-between text-xs text-stone-300">
					<div class="flex items-center gap-1.5">
						<Icon name="check" size={13} class="text-emerald-400" />
						<span>Pendaftar pertama: Owner</span>
					</div>
					<div class="flex items-center gap-1.5 font-medium text-amber-200">
						<Icon name="users" size={13} class="text-amber-400" />
						<span>Anggota tim selanjutnya: User</span>
					</div>
				</div>

				<div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
					<div class="flex -space-x-2">
						<div class="size-7 rounded-full bg-blue-600 text-[10px] font-bold text-white grid place-items-center ring-2 ring-stone-900">AO</div>
						<div class="size-7 rounded-full bg-emerald-600 text-[10px] font-bold text-white grid place-items-center ring-2 ring-stone-900">US</div>
						<div class="size-7 rounded-full bg-sky-600 text-[10px] font-bold text-white grid place-items-center ring-2 ring-stone-900">+3</div>
					</div>
					<span class="text-[11px] text-stone-300 flex items-center gap-1.5 font-medium">
						<Icon name="shield" size={14} class="text-emerald-400" />
						Akses Sesuai Peran
					</span>
				</div>
			</div>
		</div>

		<!-- Footer Brand Panel -->
		<div class="relative z-10 flex items-center justify-between text-xs text-stone-400 border-t border-white/10 pt-4">
			<div class="flex items-center gap-2">
				<Icon name="shield" size={14} class="text-emerald-400" />
				<span>Enkripsi Sesi PBKDF2 SHA-256</span>
			</div>
			<span>Waktu Asia/Jakarta (WIB)</span>
		</div>
	</div>

	<!-- Form Side -->
	<div class="relative flex min-h-screen flex-col items-center justify-center p-5 sm:p-10 bg-canvas transition-colors">
		<!-- Theme Toggle (Pojok Kanan Atas) -->
		<div class="absolute top-5 right-5 sm:top-8 sm:right-8 flex items-center gap-2">
			<button
				type="button"
				class="grid size-9 place-items-center rounded-xl border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink transition active:scale-95 shadow-2xs"
				onclick={toggleTheme}
				aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
				title={theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}
			>
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
			</button>
		</div>

		<div class="w-full max-w-[420px] rounded-3xl border border-border-base/80 bg-surface/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all">
			<!-- Header Mobile Brand -->
			<div class="mb-6 flex items-center gap-2.5 lg:hidden">
				<span
					class="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-orange-600 font-[family-name:var(--font-display)] text-lg font-bold text-white shadow-xs"
				>
					M
				</span>
				<span class="font-[family-name:var(--font-display)] text-xl font-bold text-ink">Mng-Task</span>
			</div>

			<div>
				<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-ink">
					Daftar Akun Baru 🚀
				</h2>
				<p class="mt-1 text-sm text-ink-secondary">
					Lengkapi formulir di bawah untuk membuat akun Mng-Task.
				</p>
			</div>

			{#if error}
				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger"
					role="alert"
				>
					<Icon name="alert" size={16} class="mt-0.5 shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={onSubmit}
				class="mt-5 flex flex-col gap-3.5"
				aria-busy={submitting}
				novalidate
			>
				<Input
					label="Nama Lengkap"
					name="name"
					type="text"
					autocomplete="name"
					required
					bind:value={name}
					placeholder="Contoh: Budi Pratama"
				/>

				<Input
					label="Username atau Email"
					name="email"
					type="text"
					autocomplete="username"
					required
					bind:value={email}
					placeholder="Contoh: budi atau budi@perusahaan.com"
				/>

				<Input
					label="Kata Sandi (Minimal 6 karakter)"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					bind:value={password}
					placeholder="••••••••"
				/>

				<Input
					label="Konfirmasi Kata Sandi"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					bind:value={confirmPassword}
					placeholder="••••••••"
				/>

				<Button type="submit" loading={submitting} class="mt-2 w-full h-11 text-sm font-bold shadow-md shadow-primary/20">
					{#if submitting}
						Mendaftarkan Akun…
					{:else}
						Daftar & Masuk Otomatis
					{/if}
				</Button>

				<div class="mt-2 text-center text-xs text-ink-secondary">
					Sudah punya akun?{' '}
					<a href="/login" class="font-bold text-primary hover:underline">
						Masuk di sini sekarang →
					</a>
				</div>
			</form>
		</div>
	</div>
</div>