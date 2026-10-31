<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let name = $state('');
	let email = $state('');
	let emailPassword = $state('');

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let orgName = $state('');

	$effect(() => {
		name = data.user.name;
		email = data.user.email;
		orgName = data.settings['org_name'] ?? 'Mng-Task';
	});
</script>

<svelte:head>
	<title>Pengaturan — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Pengaturan</h1>
		<p class="page-sub">Kelola profil pribadimu, keamanan akun, dan preferensi aplikasi.</p>
	</div>
</div>

{#if data.saved}
	<div
		class="mb-4 flex items-start gap-2 rounded-lg border border-success/30 bg-[var(--success-soft)] px-3 py-2.5 text-xs text-success"
		role="status"
	>
		<Icon name="check" size={15} class="mt-0.5 shrink-0" />
		<span>Pengaturan berhasil diperbarui.</span>
	</div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<!-- Kolom 1: Profil & Organisasi -->
	<div class="stack">
		<!-- Profil Pribadi -->
		<Card title="Profil Saya" subtitle="Nama dan email akun yang sedang aktif">
			<div class="mb-4 flex items-center gap-3">
				<Avatar name={data.user.name} size="lg" />
				<div>
					<p class="font-semibold text-ink">{data.user.name}</p>
					<p class="text-xs text-ink-muted">{data.user.email} · {data.user.role === 'OWNER' ? 'Owner' : 'User'}</p>
				</div>
			</div>

			<!-- Form Ubah Nama -->
			<form method="POST" action="?/updateName" use:enhance class="stack mb-6 border-b border-border-base/30 pb-6">
				{#if form?.form === 'name' && form?.error}
					<p class="text-xs text-danger">{form.error}</p>
				{/if}
				<Input label="Nama lengkap" name="name" required bind:value={name} />
				<div class="flex justify-end">
					<Button type="submit" size="sm">Simpan nama</Button>
				</div>
			</form>

			<!-- Form Ubah Email -->
			<form method="POST" action="?/updateEmail" use:enhance class="stack">
				{#if form?.form === 'email' && form?.error}
					<p class="text-xs text-danger">{form.error}</p>
				{/if}
				<Input label="Email baru" name="email" type="email" required bind:value={email} />
				<Input
					label="Konfirmasi kata sandi"
					name="password"
					type="password"
					required
					bind:value={emailPassword}
					hint="Masukkan password saat ini untuk memverifikasi perubahan email."
					placeholder="••••••••"
				/>
				<div class="flex justify-end">
					<Button type="submit" size="sm">Ubah email</Button>
				</div>
			</form>
		</Card>

		<!-- Pengaturan Organisasi (Owner Only) -->
		{#if data.isOwner}
			<Card title="Organisasi" subtitle="Hanya Owner yang dapat mengubah konfigurasi ini">
				<form method="POST" action="?/updateOrg" use:enhance class="stack">
					{#if form?.form === 'org' && form?.error}
						<p class="text-xs text-danger">{form.error}</p>
					{/if}
					<Input label="Nama Organisasi / Tim" name="orgName" required bind:value={orgName} />
					<div class="flex justify-end">
						<Button type="submit" size="sm">Simpan organisasi</Button>
					</div>
				</form>
			</Card>
		{/if}
	</div>

	<!-- Kolom 2: Keamanan & Sesi -->
	<div class="stack">
		<!-- Ganti Password -->
		<Card title="Ganti Kata Sandi" subtitle="Perbarui password secara berkala untuk menjaga keamanan">
			<form method="POST" action="?/changePassword" use:enhance class="stack">
				{#if form?.form === 'password' && form?.error}
					<p class="text-xs text-danger">{form.error}</p>
				{/if}
				<Input
					label="Kata sandi saat ini"
					name="currentPassword"
					type="password"
					required
					bind:value={currentPassword}
					placeholder="••••••••"
				/>
				<Input
					label="Kata sandi baru"
					name="newPassword"
					type="password"
					required
					minlength={8}
					bind:value={newPassword}
					hint="Minimal 8 karakter."
					placeholder="••••••••"
				/>
				<Input
					label="Ulangi kata sandi baru"
					name="confirmPassword"
					type="password"
					required
					minlength={8}
					bind:value={confirmPassword}
					placeholder="••••••••"
				/>
				<div class="flex justify-end">
					<Button type="submit" size="sm">Ganti kata sandi</Button>
				</div>
			</form>
		</Card>

		<!-- Sesi & Logout Lain -->
		<Card title="Sesi & Perangkat" subtitle="Kelola login aktif pada perangkat lain">
			<p class="text-sm text-ink-secondary">
				Jika kamu merasa akunmu terbuka di perangkat atau browser lain, kamu bisa mencabut semua sesi sekaligus.
			</p>
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<form method="POST" action="?/logoutOtherDevices" use:enhance>
					<Button type="submit" variant="secondary" size="sm">
						Cabut sesi di perangkat lain
					</Button>
				</form>
				<form method="POST" action="/logout" use:enhance>
					<Button type="submit" variant="danger" size="sm">
						<Icon name="logout" size={14} />
						Keluar dari akun
					</Button>
				</form>
			</div>
		</Card>
	</div>
</div>
